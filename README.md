# 🍡 Scoop-proxy-cn

适合中国大陆用户使用的 [Scoop](https://scoop.sh) buckets 代理镜像库。从多个开源 `bucket` 仓库同步更新，并将从 `github release` 下载的应用地址修改为基于 `ghporxy.com` 的代理下载地址。

## Usage

```powershell
scoop bucket add spc https://ghproxy.com/https://github.com/lzwme/scoop-proxy-cn

# install apps
scoop install spc/<app_name>
```

## Scoop 安装与配置参考


打开 `PowerShell` 并执行如下命令进行安装：

```powershell
# install
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# irm -useb get.scoop.sh | iex
irm https://ghproxy.com/raw.githubusercontent.com/lzwme/scoop-proxy-cn/master/install.ps1 | iex

# config
scoop config SCOOP_REPO https://ghproxy.com/github.com/ScoopInstaller/Scoop
scoop bucket rm main
scoop bucket add main https://ghproxy.com/github.com/ScoopInstaller/Main
scoop bucket add spc https://ghproxy.com/https://github.com/lzwme/scoop-proxy-cn

# show help
scoop help

# install 7zip、aria2、scoop-search...
scoop install spc/7zip spc/aria2 spc/scoop-search
```

### 关于 `scoop-search`

由于 `scoop-proxy-cn` 仓库同步了 `1.4w+` 应用，官方的基于 `PowerShell` 编写的 `scoop search` 命令效率差到无法实用，推荐安装并使用基于 `go` 语言开发的 `scoop-search` 工具替代。示例：

```bash
scoop install scoop-search
# 使用 scoop-search
scoop-search act
```

## Sync Buckets From

- [https://github.com/ScoopInstaller/PHP](ScoopInstaller/PHP)
- [https://github.com/ScoopInstaller/Main](ScoopInstaller/Main)
- [https://github.com/ScoopInstaller/Extras](ScoopInstaller/Extras)
- [https://github.com/ScoopInstaller/Java](ScoopInstaller/Java)
- [https://github.com/ScoopInstaller/Versions](ScoopInstaller/Versions)
- [https://github.com/ScoopInstaller/Nirsoft](ScoopInstaller/Nirsoft)
- [https://github.com/ScoopInstaller/Nonportable](ScoopInstaller/Nonportable)
- [https://github.com/scoopcn/scoopcn](scoopcn/scoopcn)
- [https://github.com/rasa/scoops](rasa/scoops)
- [https://github.com/ACooper81/scoop-apps](ACooper81/scoop-apps)
- [https://github.com/kkzzhizhou/scoop-zapps](kkzzhizhou/scoop-zapps)
- [https://github.com/Calinou/scoop-games](Calinou/scoop-games)
- [https://github.com/cderv/r-bucket](cderv/r-bucket)
- [https://github.com/chawyehsu/dorado](chawyehsu/dorado)
- [https://github.com/borger/scoop-galaxy-integrations](borger/scoop-galaxy-integrations)
- [https://github.com/hoilc/scoop-lemon](hoilc/scoop-lemon)
- [https://github.com/ivaquero/scoopet](ivaquero/scoopet)
- [https://github.com/KNOXDEV/wsl](KNOXDEV/wsl)
- [https://github.com/kodybrown/scoop-nirsoft](kodybrown/scoop-nirsoft)
- [https://github.com/kidonng/sushi](kidonng/sushi)
- [https://github.com/littleli/scoop-clojure](littleli/scoop-clojure)
- [https://github.com/niheaven/scoop-sysinternals](niheaven/scoop-sysinternals)
- [https://github.com/matthewjberger/scoop-nerd-fonts](matthewjberger/scoop-nerd-fonts)
- [https://github.com/TheCjw/scoop-retools](TheCjw/scoop-retools)
- [https://github.com/TheRandomLabs/Scoop-Bucket](TheRandomLabs/Scoop-Bucket)
- [https://github.com/TheRandomLabs/scoop-nonportable](TheRandomLabs/scoop-nonportable)
- [https://github.com/TheRandomLabs/Scoop-Spotify](TheRandomLabs/Scoop-Spotify)
- [https://github.com/Paxxs/Cluttered-bucket](Paxxs/Cluttered-bucket)
- [https://github.com/zhoujin7/tomato](zhoujin7/tomato)
- [https://github.com/HCLonely/my-scoop-bucket](HCLonely/my-scoop-bucket)
- [https://github.com/Weidows-projects/scoop-3rd](Weidows-projects/scoop-3rd)
- [https://github.com/hermanjustnu/scoop-emulators](hermanjustnu/scoop-emulators)
- [https://github.com/everyx/scoop-bucket](everyx/scoop-bucket)
- [https://github.com/borger/scoop-emulators](borger/scoop-emulators)
- [https://github.com/ZvonimirSun/scoop-iszy](ZvonimirSun/scoop-iszy)
- [https://github.com/kiennq/scoop-misc](kiennq/scoop-misc)
- [https://github.com/wzv5/ScoopBucket](wzv5/ScoopBucket)
- [https://github.com/TheRandomLabs/Scoop-Python](TheRandomLabs/Scoop-Python)
- [https://github.com/naderi/scoop-bucket](naderi/scoop-bucket)
- [https://github.com/ViCrack/scoop-bucket](ViCrack/scoop-bucket)
- [https://github.com/42wim/scoop-bucket](42wim/scoop-bucket)
- [https://github.com/akirco/aki-apps](akirco/aki-apps)
- [https://github.com/batkiz/backit](batkiz/backit)
- [https://github.com/iquiw/scoop-bucket](iquiw/scoop-bucket)
- [https://github.com/ygguorun/scoop-bucket](ygguorun/scoop-bucket)
- [https://github.com/seumsc/scoop-seu](seumsc/scoop-seu)
- [https://github.com/cc713/ownscoop](cc713/ownscoop)
- [https://github.com/aoisummer/scoop-bucket](aoisummer/scoop-bucket)
- [https://github.com/yuusakuri/scoop-bucket](yuusakuri/scoop-bucket)
- [https://github.com/hu3rror/scoop-muggle](hu3rror/scoop-muggle)
- [https://github.com/starise/Scoop-Confetti](starise/Scoop-Confetti)
- [https://github.com/jingyu9575/scoop-jingyu9575](jingyu9575/scoop-jingyu9575)
- [https://github.com/anderlli0053/DEV-tools](anderlli0053/DEV-tools)
- [https://github.com/okibcn/ScoopMaster](okibcn/ScoopMaster)

## 声明

本仓库包含的应用信息仅从第三方仓库同步，未逐一作可用性、安全性验证，请在安装选择时自行验证识别。若有侵权请提 issues 处理。
