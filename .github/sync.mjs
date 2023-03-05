import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { semverCompare } from '@lzwme/fe-utils';
import { safeJsonParse } from './utils.mjs';

const isDebug = process.argv.slice(2).includes('--debug');
const isCI = process.env.SYNC != null;
const CONSTS = {
  rootDir: process.cwd(),
  tmpDir: path.resolve('tmp'),
  repo: [
    `ScoopInstaller/PHP`,
    `ScoopInstaller/Main`,
    `ScoopInstaller/Extras`,
    `ScoopInstaller/Java`,
    `ScoopInstaller/Versions`,
    `ScoopInstaller/Nirsoft`,
    `ScoopInstaller/Nonportable`,
    `scoopcn/scoopcn`,
    `ACooper81/scoop-apps`,
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
    `rasa/scoops`,
    `zhoujin7/tomato`,
    `kkzzhizhou/scoop-apps`,
    `anderlli0053/DEV-tools`,
    // `tetradice/scoop-iyokan-jp`,
    // `Qv2ray/mochi`,
    // `duzyn/scoop-cn`,
  ],
  filter: /audacity_installer|\.gitkeep|__/,
};
const destFilesCache = new Map();
const bucketLowPriority = parseBucketTxtFile();
const bucketIgnoreList = parseBucketTxtFile('bucket-ignored.txt');

function parseBucketTxtFile(filename = 'bucket-low-priority.txt') {
  const str = fs.readFileSync(path.resolve(CONSTS.rootDir, filename), 'utf8').trim();
  const list = str
    .split('\n')
    .slice(1)
    .filter(d => d.includes(', '))
    .map(d => path.resolve(CONSTS.tmpDir, d.replace('/', '-').replace(', ', '/')));

  return new Set(list);
}

async function checkout(repo, dirName) {
  if (!fs.existsSync(CONSTS.tmpDir)) fs.mkdirSync(CONSTS.tmpDir);

  try {
    const dirpath = path.resolve(CONSTS.tmpDir, dirName);
    if (fs.existsSync(dirpath)) {
      execSync(`cd "${dirpath}" && git pull`, { cwd: CONSTS.tmpDir });
    } else {
      repo = isDebug ? `https://ghproxy.com/https://github.com/${repo}` : `https://github.com/${repo}.git`;
      execSync(`git clone --depth 1 ${repo} ${dirName}`, { cwd: CONSTS.tmpDir });
    }
  } catch (error) {
    console.error(`checkout ${repo} failed!`, error.message);
  }
}

async function syncDir(src, dest, repo = '') {
  let total = 0;
  const basename = path.basename(src);

  if (!fs.existsSync(src) || CONSTS.filter.test(basename)) return total;
  if (bucketIgnoreList.has(src)) return;

  const stats = fs.statSync(src);
  const ext = path.extname(src);

  if (stats.isFile()) {
    const destLowerCase = String(dest).toLowerCase();
    let content = '';
    let contentJson;

    if (destFilesCache.has(destLowerCase)) {
      if ('.json' !== ext || bucketLowPriority.has(src)) return total;

      dest = destFilesCache.get(destLowerCase).dest; // 使用旧路径
      try {
        // json 文件比较版本
        content = fs.readFileSync(src, 'utf8').trim();
        contentJson = safeJsonParse(content, src, true);
        const destVersion = safeJsonParse(fs.readFileSync(dest, 'utf8'), dest).version;
        if (semverCompare(contentJson.version || '', destVersion, false) < 1) return total;
        // console.debug(`[sync]overwide old version: \x1B[33m${contentJson.version}\x1B[39m -> \x1B[32m${destVersion} \x1b[36m${src.slice(CONSTS.tmpDir.length + 1)}\x1b[39m`);
      } catch (e) {
        console.error('[error]try compare version failed!', src, dest, e.message);
        return total;
      }
    }
    destFilesCache.set(destLowerCase, { dest, src: src.slice(CONSTS.tmpDir.length + 1), repo });

    if (['.json', '.ps1', '.sh'].includes(ext)) {
      if (!content) content = fs.readFileSync(src, 'utf8');
      const rawContent = content;

      if ('.json' === ext) {
        if (!contentJson) contentJson = safeJsonParse(content, src);
        if (Object.keys(contentJson).length > 0) {
          contentJson._from = repo;
          content = JSON.stringify(contentJson, null, 2);
        } else content = content.replaceAll('\r\n', '\n').trim();

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
    console.log('Changes:\n', changes);
    const cmds = [
      `git config user.name "github-actions[bot]"`,
      `git config user.email "41898282+github-actions[bot]@users.noreply.github.com"`,
      `git add --all`,
      `git commit -m "Updated at ${new Date().toISOString()}"`,
      `git push`,
    ];

    for (const cmd of cmds) execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 });
  } else {
    console.log('Not Updated');
  }
}

function updateInstallps1() {
  const installUrl = `${isDebug ? 'https://ghproxy.com/' : ''}https://raw.githubusercontent.com/scoopinstaller/install/master/install.ps1`;
  execSync(`curl ${installUrl} > install.ps1`);
  syncDir('install.ps1', 'install.ps1');
}

async function sync() {
  updateInstallps1();
  if (isCI) {
    ['bucket', 'scripts', 'tmp'].forEach(d => fs.existsSync(d) && fs.rmSync(d, { recursive: true, force: true }));
  }

  const stats = {};

  for (const repo of CONSTS.repo) {
    const repoDirName = repo.replaceAll('/', '-');
    console.log(`sync for \x1B[32m${repo}\x1B[39m`);
    await checkout(repo, repoDirName);
    for (const fname of ['bucket', 'scripts']) {
      const count = await syncDir(path.resolve(CONSTS.tmpDir, repoDirName, fname), fname, repo);
      if (!count && fname === 'bucket') console.warn(`[warn][synced nothing]`, repo);
      stats[fname] = (stats[fname] || 0) + count;
    }
  }

  if (isCI) {
    fs.rmSync(CONSTS.tmpDir, { recursive: true, force: true });
    gitCommit();
  }

  console.log('Done!', `Total: ${destFilesCache.size}`, stats);
}

sync();
