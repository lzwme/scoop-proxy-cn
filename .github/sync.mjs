import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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
    `Ash258/GenericBucket`,
    `anderlli0053/DEV-tools`,
    `Calinou/scoop-games`,
    `cderv/r-bucket`,
    `chawyehsu/dorado`,
    `borger/scoop-galaxy-integrations`,
    `hoilc/scoop-lemon`,
    `ivaquero/scoopet`,
    `KNOXDEV/wsl`,
    `kkzzhizhou/scoop-apps`,
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
    // `tetradice/scoop-iyokan-jp`,
    // `Qv2ray/mochi`,
    // `duzyn/scoop-cn`,
  ],
  filter: /audacity_installer|\.gitkeep|__/,
};

async function checkout(repo, dirName) {
  if (!fs.existsSync(CONSTS.tmpDir)) fs.mkdirSync(CONSTS.tmpDir);

  try {
    if (fs.existsSync(path.resolve(CONSTS.tmpDir, dirName))) return;

    repo = isDebug ? `https://ghproxy.com/https://github.com/${repo}` : `https://github.com/${repo}.git`;
    execSync(`git clone --depth 1 ${repo} ${dirName}`, { cwd: CONSTS.tmpDir });
  } catch (error) {
    console.error(`checkout ${repo} failed!`, error.message);
  }
}

async function syncDir(src, desc) {
  let total = 0;
  const basename = path.basename(src);

  if (!fs.existsSync(src) || CONSTS.filter.test(basename)) return total;

  const stats = fs.statSync(src);

  if (stats.isFile()) {
    if (fs.existsSync(desc)) return total;

    const ext = path.extname(src);

    if (['.json', '.ps1', '.sh'].includes(ext)) {
      let content = fs.readFileSync(src, 'utf8');

      if ('.json' === ext) content = content.replaceAll('\r\n', '\n');

      if (basename.startsWith('nodejs')) {
        content = content
          .replace(/(https:\/\/nodejs\.org\/dist\/)/img, 'https://registry.npmmirror.com/-/binary/node/');
      } else if (content.includes('github.com') || content.includes('https://raw.githubusercontent.com')) {
        content = content
          .replace(/(https:\/\/github\.com.+\/releases\/download\/)/img, 'https://ghproxy.com/$1')
          .replace(/(https:\/\/github\.com.+\/archive\/)/img, 'https://ghproxy.com/$1')
          .replace(/(https\:\/\/raw\.githubusercontent\.com)/img, 'https://ghproxy.com/$1')
          // todo: nodejs、and more...
          .replaceAll('https://ghproxy.com/https://ghproxy.com', 'https://ghproxy.com');
      }

      fs.writeFileSync(desc, content, 'utf8');
    } else {
      fs.writeFileSync(desc, fs.readFileSync(src));
    }

    return ++total;
  }

  if (stats.isDirectory()) {
    if (!fs.existsSync(desc)) fs.mkdirSync(desc, { recursive: true });

    const list = fs.readdirSync(src);
    for (let filename of list) {
      total += await syncDir(path.resolve(src, filename), path.resolve(desc, filename));
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

  let bucketFiles = 0;
  let scriptsFiles = 0;

  for (const repo of CONSTS.repo) {
    const repoDirName = repo.replaceAll('/', '-');
    console.log(`sync for \x1B[32m${repo}\x1B[39m`);
    await checkout(repo, repoDirName);
    bucketFiles += await syncDir(path.resolve(CONSTS.tmpDir, repoDirName, 'bucket'), 'bucket');
    scriptsFiles += await syncDir(path.resolve(CONSTS.tmpDir, repoDirName, 'scripts'), 'scripts');
  }

  if (isCI) {
    fs.rmSync(CONSTS.tmpDir, { recursive: true, force: true });
    gitCommit();
  }

  console.log('Done!', bucketFiles, scriptsFiles);
}

sync();
