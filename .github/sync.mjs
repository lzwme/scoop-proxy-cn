import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { semverCompare, color, getLogger, rmrf } from '@lzwme/fe-utils';
import { safeJsonParse } from './utils.mjs';

const isDebug = process.argv.slice(2).includes('--debug');
const isCI = process.env.SYNC != null;
const logger = getLogger('SYNC', isDebug ? 'debug' : 'log');
const rootDir = path.resolve(fileURLToPath(import.meta.url), '../..');
const CONFIG = {
  rootDir,
  /** 是否忽略 manifest JSON 解析失败的应用 */
  ignoreParseFailed: false,
  tmpDir: path.resolve(rootDir, 'tmp'),
  /** 同步仓库列表，按仓库质量排序 */
  repo: new Set([
    // `duzyn/scoop-cn`, // 仅同步官方仓库，并修改为国内镜像地址
    `ScoopInstaller/PHP`,
    `ScoopInstaller/Main`,
    `ScoopInstaller/Extras`,
    `ScoopInstaller/Java`,
    `ScoopInstaller/Versions`,
    `ScoopInstaller/Nirsoft`,
    `ScoopInstaller/Nonportable`,
    `scoopcn/scoopcn`, // 大多是国内应用程序
    `rasa/scoops`,
    `ACooper81/scoop-apps`,
    `kkzzhizhou/scoop-zapps`,
    `Calinou/scoop-games`,
    `cderv/r-bucket`,
    `chawyehsu/dorado`,
    `borger/scoop-galaxy-integrations`,
    `hoilc/scoop-lemon`,
    `ivaquero/scoopet`,
    `KNOXDEV/wsl`,
    `kodybrown/scoop-nirsoft`,
    `kidonng/sushi`,
    `littleli/scoop-clojure`,
    `niheaven/scoop-sysinternals`,
    `matthewjberger/scoop-nerd-fonts`,
    `TheCjw/scoop-retools`,
    `TheRandomLabs/Scoop-Bucket`,
    `TheRandomLabs/scoop-nonportable`,
    `TheRandomLabs/Scoop-Spotify`,
    `Paxxs/Cluttered-bucket`,
    `zhoujin7/tomato`,
    `HCLonely/my-scoop-bucket`,
    `Weidows-projects/scoop-3rd`,
    `hermanjustnu/scoop-emulators`,
    `everyx/scoop-bucket`,
    `borger/scoop-emulators`,
    `ZvonimirSun/scoop-iszy`,
    `kiennq/scoop-misc`,
    `wzv5/ScoopBucket`,
    `TheRandomLabs/Scoop-Python`,
    `naderi/scoop-bucket`,
    `ViCrack/scoop-bucket`,
    `42wim/scoop-bucket`,
    `akirco/aki-apps`,
    `batkiz/backit`,
    `iquiw/scoop-bucket`,
    `ygguorun/scoop-bucket`,
    `seumsc/scoop-seu`,
    `cc713/ownscoop`,
    `aoisummer/scoop-bucket`,
    `yuusakuri/scoop-bucket`,
    `hu3rror/scoop-muggle`,
    `starise/Scoop-Confetti`,
    // `dodorz/scoop`, // 0
    // `Qv2ray/mochi`, // 0
    // `wangzq/scoop-bucket`, // 0
    // `NyaMisty/scoop_bucket_misty`, // 0
    // `TheLastZombie/scoop-bucket`, // 0
    // `Velgus/Scoop-Portapps`, // 0
    // `amorphobia/siku`, // 0
    // `jonz94/scoop-sarasa-nerd-fonts`, // 0
    // `rivy/scoop-bucket`, // 0
    // `starise/Scoop-Gaming`, // 0
    // `Darkatse/Scoop-KanColle`, // 0
    // `hulucc/bucket`, // 0
    // `Deide/deide-bucket`, // 0
    `jingyu9575/scoop-jingyu9575`,
    // `tetradice/scoop-iyokan-jp`,
    // `kkzzhizhou/scoop-apps`, // 抓其他仓库自动同步【会将 todo、deprecated 的都抓进来】
    `anderlli0053/DEV-tools`, // low quality
    `okibcn/ScoopMaster`, // 抓取其他仓库(https://rasa.github.io/scoop-directory/by-apps.html)自动同步(879+)
  ]),
  filter: /audacity_installer|\.gitkeep|__/,
  sourcesStatFile: path.resolve(rootDir, `sync-sources.txt`),
  lowPriorityFile: path.resolve(rootDir, 'bucket-low-priority.txt'),
  ignoredFile: path.resolve(rootDir, 'bucket-ignored.txt'),
};
const destFilesCache = new Map();
const lowPrioritySet = parseTxtFile(CONFIG.lowPriorityFile);
const ignoredSet = parseTxtFile(CONFIG.ignoredFile);

function parseTxtFile(filename) {
  const str = fs.readFileSync(path.resolve(CONFIG.rootDir, filename), 'utf8').trim();
  const list = str
    .split('\n')
    .filter(d => d && !d.startsWith('#'))
    .map(d => {
      if (d.includes(', ')) return path.resolve(CONFIG.tmpDir, d.replace('/', '-').replace(', ', '/'));
      return d;
    });

  return new Set(list);
}

async function checkout(repo, dirName) {
  if (!fs.existsSync(CONFIG.tmpDir)) fs.mkdirSync(CONFIG.tmpDir);

  try {
    const dirpath = path.resolve(CONFIG.tmpDir, dirName);
    if (fs.existsSync(dirpath)) {
      execSync(`cd "${dirpath}" && git pull`, { cwd: CONFIG.tmpDir });
    } else {
      repo = isDebug ? `https://ghproxy.com/github.com/${repo}` : `https://github.com/${repo}.git`;
      execSync(`git clone --depth 1 ${repo} ${dirName}`, { cwd: CONFIG.tmpDir });
    }
  } catch (error) {
    logger.error(`checkout ${repo} failed!`, error.message);
  }
}

async function syncDir(src, dest, repo = '') {
  let total = 0;
  const basename = path.basename(src);

  src = path.resolve(rootDir, src);
  dest = path.resolve(rootDir, dest);

  if (!fs.existsSync(src) || CONFIG.filter.test(basename)) return total;
  if (ignoredSet.has(basename) || ignoredSet.has(src)) return;

  const stats = fs.statSync(src);
  const ext = path.extname(src);

  if (stats.isFile()) {
    const srcRelative = src.slice(CONFIG.tmpDir.length + 1);
    const destLowerCase = String(dest).toLowerCase();
    let content = '';
    let contentJson;

    if (destFilesCache.has(destLowerCase)) {
      if ('.json' !== ext || lowPrioritySet.has(src) || lowPrioritySet.has(basename)) return total;

      dest = destFilesCache.get(destLowerCase).dest; // 使用旧路径
      try {
        // json 文件比较版本
        content = fs.readFileSync(src, 'utf8').trim();
        contentJson = safeJsonParse(content, src, true);
        const oldJson = safeJsonParse(fs.readFileSync(dest, 'utf8'), dest);
        if (semverCompare(String(contentJson.version || ''), String(oldJson.version || ''), false) < 1) return total;
        logger.debug(`[sync]overwide: ${color.gray(oldJson.version)} -> ${color.green(contentJson.version)} ${color.cyan(basename)} ${color.yellow(oldJson._from)}`);
      } catch (e) {
        logger.error('[error]try compare version failed!', src, dest, e.message);
        return total;
      }
    }
    destFilesCache.set(destLowerCase, { dest, src: srcRelative, repo, fixed: false });

    if (['.json', '.ps1', '.sh'].includes(ext)) {
      if (!content) content = fs.readFileSync(src, 'utf8');
      const rawContent = content;

      if ('.json' === ext) {
        if (!contentJson) contentJson = safeJsonParse(content, srcRelative);
        if (Object.keys(contentJson).length > 0) {
          contentJson._from = repo;
          content = JSON.stringify(contentJson, null, 2);
        } else {
          if (CONFIG.ignoreParseFailed) return total;
          content = content.replaceAll('\r\n', '\n').trim();
        }

        // fix for https://github.com/lzwme/scoop-proxy-cn/issues/2
        content = content.replace(/\$bucketsdir\\\\[a-zA-Z\-]+\\\\/gim, '$bucketsdir\\\\$bucket\\\\');

        if (basename.startsWith('php')) {
          content = content.replace('bin\\postinstall.ps1', 'bin\\php-postinstall.ps1');
        }
      }

      if (basename.startsWith('nodejs')) {
        content = content.replace(/(https:\/\/nodejs\.org\/dist\/)/gim, 'https://registry.npmmirror.com/-/binary/node/');
      } else if (content.includes('github.com') || content.includes('githubusercontent.com')) {
        content = content
          .replace(/(https:\/\/github\.com.+\/releases\/download\/)/gim, 'https://ghproxy.com/$1')
          .replace(/(https:\/\/github\.com.+\/archive\/)/gim, 'https://ghproxy.com/$1')
          .replace(/(https\:\/\/(raw|gist)\.githubusercontent\.com)/gim, 'https://ghproxy.com/$1')
          .replaceAll('https://ghproxy.com/https://ghproxy.com', 'https://ghproxy.com');
      }
      destFilesCache.get(destLowerCase).fixed = content !== rawContent;
      fs.writeFileSync(dest, content, 'utf8');
    } else {
      fs.writeFileSync(dest, fs.readFileSync(src));
    }

    return ++total;
  }

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const list = fs.readdirSync(src);
    for (let filename of list) {
      total += await syncDir(path.resolve(src, filename), path.resolve(dest, filename), repo);
    }
  }

  return total;
}

async function gitCommit() {
  const changes = execSync('git status --short', { encoding: 'utf8' }).trim(); // --untracked-files=no
  if (changes.length > 5) {
    logger.info('Changes:\n', changes);
    const cmds = [
      `git config user.name "github-actions[bot]"`,
      `git config user.email "41898282+github-actions[bot]@users.noreply.github.com"`,
      `git add --all`,
      `git commit -m "Updated at ${new Date().toISOString()}"`,
      `git push`,
    ];

    for (const cmd of cmds) execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 });
  } else {
    logger.info('Not Updated');
  }
}
function outputSources() {
  logger.debug('starting output for', CONFIG.sourcesStatFile);

  const content = [...destFilesCache.values()]
    .sort((a, b) => a.src > b.src)
    .map(item => {
      return `${item.src.replace(CONFIG.tmpDir), ''}, ${item.repo}, ${item.fixed ? 1 : 0}`;
    })
    .join('\n');
  if (content) fs.writeFileSync(CONFIG.sourcesStatFile, content, 'utf8');
}

async function updateReadme() {
  const rdFile = path.resolve(rootDir, 'README.md');
  const list = [...CONFIG.repo].map(repo => `- [https://github.com/${repo}](${repo})`).join('\n');
  const content = fs.readFileSync(rdFile, 'utf8');
  const updated = content.replace(/## Sync Buckets From[\s\S]+##/g, `## Sync Buckets From\n\n${list}\n\n##`);
  if (updated !== content) fs.writeFileSync(rdFile, updated, 'utf8');
  else logger.debug('[UPDATE-READE] No Chagned');
}

function updateInstallps1() {
  logger.debug('starting update install.ps1');
  const installUrl = `${isDebug ? 'https://ghproxy.com/' : ''}https://raw.githubusercontent.com/scoopinstaller/install/master/install.ps1`;
  execSync(`curl ${installUrl} > install.ps1`);
  syncDir('install.ps1', 'install.ps1');
}

async function sync() {
  const stats = {
    sync: { bucket: 0, scripts: 0 },
    repo: {},
  };

  updateInstallps1();
  if (isCI) [...Object.keys(stats.sync), "tmp"].forEach((d) => rmrf(d));

  for (const repo of CONFIG.repo) {
    const repoDirName = repo.replaceAll('/', '-');
    logger.info(`sync for ${color.greenBright(repo)}`);
    await checkout(repo, repoDirName);
    stats.repo[repo] = {};
    for (const fname of Object.keys(stats.sync)) {
      stats.repo[repo][fname] = await syncDir(path.resolve(CONFIG.tmpDir, repoDirName, fname), fname, repo);
      if (!stats.repo[repo][fname] && fname === 'bucket') logger.warn(`[warn][${fname}][synced nothing]`, color.yellowBright(repo));
      else logger.info(` - [synced][${color.green(fname)}]`, stats.repo[repo][fname]);
      stats.sync[fname] += stats.repo[repo][fname];
    }
  }

  if (isCI) {
    fs.rmSync(CONFIG.tmpDir, { recursive: true, force: true });
    outputSources();
    updateReadme();
    gitCommit();
  }

  const fixedCount = [...destFilesCache.values()].filter(d => d.fixed).length;
  logger.info('Done!', `Total: ${destFilesCache.size}, Fixed: ${fixedCount}`, stats);
}

sync();
