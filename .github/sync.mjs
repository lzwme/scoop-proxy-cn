import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { semverCompare, color, rmrf } from '@lzwme/fe-utils';
import { safeJsonParse, checkoutRepo } from './sync/utils.mjs';
import { CONFIG, rootDir, logger } from './sync/config.mjs';
import { customHandler } from './sync/customHandler.mjs';

const destFilesCache = new Map();
const lowPrioritySet = parseTxtFile(CONFIG.lowPriorityFile);
const ignoredSet = parseTxtFile(CONFIG.ignoredFile);

function parseTxtFile(filename) {
  const str = fs.readFileSync(path.resolve(CONFIG.rootDir, filename), 'utf8').trim();
  const list = str
    .split('\n')
    .filter(d => d && !d.startsWith('#'))
    .map(d => d.includes(', ') ? path.resolve(CONFIG.tmpDir, d.replace('/', '-').replace(', ', '/')) : d);

  return new Set(list);
}

async function syncDir(src, dest, repo = '') {
  let total = 0;
  const basename = path.basename(src);

  src = path.resolve(rootDir, src);
  dest = path.resolve(rootDir, dest);

  if (src.includes(`_(1).`)) return total;
  if (!fs.existsSync(src) || CONFIG.filter.test(basename)) return total;
  if (ignoredSet.has(basename) || ignoredSet.has(src)) return total;

  const stats = fs.statSync(src);
  const ext = path.extname(src);

  if (stats.isFile()) {
    const srcRelative = src.slice(CONFIG.tmpDir.length + 1);
    const destLowerCase = String(dest).toLowerCase();
    let content = '';
    let contentJson;

    if (typeof customHandler[repo]?.fileSync === 'function') {
      content = await customHandler[repo].fileSync(src, ext);
    }

    let cacheItem = destFilesCache.get(destLowerCase);
    if (destFilesCache.has(destLowerCase)) {
      if ('.json' !== ext || lowPrioritySet.has(src) || lowPrioritySet.has(basename)) return total;
      // 来自官方仓库的应用有高优先级(#7)
      if (cacheItem.repo.startsWith('ScoopInstaller/') || customHandler[cacheItem.repo]?.highPriority) return total;

      dest = cacheItem.dest; // 使用旧路径

      if (!lowPrioritySet.has(cacheItem.src)) {
        try {
          // json 文件比较版本
          if (!content) content = fs.readFileSync(src, 'utf8').trim();
          contentJson = safeJsonParse(content, src, true);
          const oldJson = safeJsonParse(fs.readFileSync(dest, 'utf8'), dest);
          if (semverCompare(String(contentJson.version || ''), String(oldJson.version || ''), false) < 1) return total;
          logger.debug(`[sync]overwide: ${color.gray(oldJson.version)} -> ${color.green(contentJson.version)} ${color.cyan(basename)} ${color.yellow(cacheItem.repo)}`);
        } catch (e) {
          logger.error('[error]try compare version failed!', src, dest, e.message);
          return total;
        }
      }
    }

    cacheItem = { dest, src: srcRelative, repo, fixed: false };
    destFilesCache.set(destLowerCase, cacheItem);

    if (['.json', '.ps1', '.sh'].includes(ext)) {
      if (!content) content = fs.readFileSync(src, 'utf8');
      let rawContent = content;

      if ('.json' === ext) {
        if (!contentJson) contentJson = safeJsonParse(content, srcRelative);
        if (Object.keys(contentJson).length > 0) {
          content = JSON.stringify(contentJson, null, 2);
        } else {
          if (CONFIG.ignoreParseFailed) return total;
          content = content.replaceAll('\r\n', '\n').trim();
        }
        rawContent = content;

        // fix for https://github.com/lzwme/scoop-proxy-cn/issues/2
        content = content.replace(/\$bucketsdir\\\\[a-zA-Z\-]+\\\\/gim, '$bucketsdir\\\\$bucket\\\\');

        if (basename.startsWith('php')) {
          content = content.replace('bin\\postinstall.ps1', 'bin\\php-postinstall.ps1');
        }
      }

      if (basename.startsWith('nodejs')) {
        content = content.replace(/(https:\/\/nodejs\.org\/dist\/)/gim, 'https://registry.npmmirror.com/-/binary/node/');
      } else if (content.includes('github.com') || content.includes('githubusercontent.com')) {
        CONFIG.ghproxyInvalid.forEach(url => {
          if (content.includes(url)) content = content.replaceAll(url, CONFIG.ghproxy);
        });

        content = content
          .replace(/(https:\/\/github\.com.+\/releases\/download\/)/gim, `${CONFIG.ghproxy}/$1`)
          .replace(/(https:\/\/github\.com.+\/archive\/)/gim, `${CONFIG.ghproxy}/$1`)
          .replace(/(https\:\/\/(raw|gist)\.githubusercontent\.com)/gim, `${CONFIG.ghproxy}/$1`)
          .replaceAll(`${CONFIG.ghproxy}/${CONFIG.ghproxy}`, CONFIG.ghproxy);
      }
      cacheItem.fixed = content !== rawContent;
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
  if (changes.length < 5) return logger.info('Not Updated');

  logger.info('Changes:\n', changes);
  const cmds = [
    `git config user.name "github-actions[lzw.me]"`,
    `git config user.email "41898282+github-actions[bot]@users.noreply.github.com"`,
    `git add --all`,
    `git commit -m "Updated at ${new Date().toISOString()}"`,
    `git push`,
  ];

  for (const cmd of cmds) execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 });
}

function outputSources() {
  logger.debug('starting output for', CONFIG.sourcesStatFile);

  const content = [...destFilesCache.values()]
    .map(item => `${item.dest.replace(CONFIG.rootDir, '').slice(1)}, ${item.repo}, ${item.fixed ? 1 : 0}`)
    .sort()
    .join('\n');
  if (content) fs.writeFileSync(CONFIG.sourcesStatFile, content, 'utf8');
}

async function updateReadme() {
  const rdFile = path.resolve(rootDir, 'README.md');
  const list = [...CONFIG.repo].map(repo => `- [${repo}](https://github.com/${repo})`).join('\n');
  const content = fs.readFileSync(rdFile, 'utf8');
  const updated = content.replace(/## Sync Buckets From[\s\S]+##/g, `## Sync Buckets From\n\n${list}\n\n##`);
  if (updated !== content) fs.writeFileSync(rdFile, updated, 'utf8');
  else logger.debug('[UPDATE-READE] No Chagned');
}

function updateInstallps1() {
  logger.debug('starting update install.ps1');
  const installUrl = `${CONFIG.debug ? `${CONFIG.ghproxy}/` : ''}https://raw.githubusercontent.com/scoopinstaller/install/master/install.ps1`;
  execSync(`curl ${installUrl} > install.ps1`);
  syncDir('install.ps1', 'install.ps1');
}

async function sync() {
  const stats = {
    sync: { bucket: 0, scripts: 0 },
    repo: {},
  };

  updateInstallps1();
  if (CONFIG.isCI) [...Object.keys(stats.sync), "tmp"].forEach((d) => rmrf(d));

  for (const repo of CONFIG.repo) {
    const repoDirName = repo.replaceAll('/', '-');
    const repoDir = path.resolve(CONFIG.tmpDir, repoDirName);
    logger.info(`sync for ${color.greenBright(repo)}`);
    await checkoutRepo(repo, CONFIG.tmpDir, CONFIG.debug);
    stats.repo[repo] = {};

    if (typeof customHandler[repo]?.preSync === 'function') {
      await customHandler[repo].preSync(repoDir);
    }

    for (const fname of Object.keys(stats.sync)) {
      stats.repo[repo][fname] = await syncDir(path.resolve(repoDir, fname), fname, repo);
      if (!stats.repo[repo][fname] && fname === 'bucket') logger.warn(`[warn][${fname}][synced nothing]`, color.yellowBright(repo));
      else logger.info(` - [synced][${color.green(fname)}]`, stats.repo[repo][fname]);
      stats.sync[fname] += stats.repo[repo][fname];
    }
  }

  if (CONFIG.isCI) {
    fs.rmSync(CONFIG.tmpDir, { recursive: true, force: true });
    outputSources();
    updateReadme();
    gitCommit();
  }

  const fixedCount = [...destFilesCache.values()].filter(d => d.fixed).length;
  logger.info('Done!', `Total: ${destFilesCache.size}, Fixed: ${fixedCount}`, stats);
}

sync();
