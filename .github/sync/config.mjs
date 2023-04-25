import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLogger } from '@lzwme/fe-utils';

const debug = process.argv.slice(2).includes('--debug');
export const isCI = process.env.SYNC != null;
export const logger = getLogger('SYNC', debug ? 'debug' : 'log');
export const rootDir = path.resolve(fileURLToPath(import.meta.url), '../../..');
export const CONFIG = {
  rootDir,
  debug,
  isCI,
  /** 是否忽略 manifest JSON 解析失败的应用 */
  ignoreParseFailed: false,
  tmpDir: path.resolve(rootDir, 'tmp'),
  ghproxy: 'https://ghproxy.net',
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
    `xfqwdsj/BucketDev`, // Android SDK DEV...
    `scoopcn/scoopcn`, // 大多是国内应用程序
    `rasa/scoops`,
    `amorphobia/siku`, // #6
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
