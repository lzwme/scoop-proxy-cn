# 🍡 scoop-proxy-cn

适合中国大陆用户使用的 [Scoop](https://scoop.sh) buckets 代理镜像库。从多个开源 `bucket` 仓库同步更新，并将从 `github release` 下载的应用地址修改为基于 `ghp.ci` 的代理下载地址。

## Usage

```powershell
scoop bucket add spc https://ghfast.top/github.com/lzwme/scoop-proxy-cn

# install apps
scoop install spc/<app_name>
```

## Scoop 安装与配置参考

### 基于国内定制镜像安装

由于 scoop 的源码和 buckets 应用基本都是以 git 形式维护在 github，github 的访问难题使得其安装、更新和应用下载都会变得体验极差。

下面介绍为 [scoop 国内镜像优化库](https://gitee.com/scoop-installer/scoop)的安装方法。

```bash
# 脚本执行策略更改，默认自动同意
Set-ExecutionPolicy RemoteSigned -scope CurrentUser -Force

# 方法一：执行安装命令（默认安装在用户目录下，如需更改请执行下面的“自定义安装目录”命令）
iwr -useb scoop.201704.xyz | iex


## 方法二：自定义安装目录（注意将目录修改为合适位置)
irm scoop.201704.xyz -outfile 'install.ps1'
.\install.ps1 -ScoopDir 'D:\Scoop' -ScoopGlobalDir 'D:\GlobalScoopApps'

# 若已安装官方源，可执行如下命令进行切换
scoop config SCOOP_REPO "https://gitee.com/scoop-installer/scoop"
# 拉取新库地址
scoop update
```

该方式安装的 scoop 经过定制修改，支持自定义代理加速站，并默认使用 `scoop.201704.xyz` 代理下载应用。

```bash
# 添加代理
scoop config URL_PROXY "https://scoop.201704.xyz"

# 删除代理
scoop config rm URL_PROXY
```

### 基于官方仓库以代理形式安装

打开 `PowerShell` 并执行如下命令进行安装：

```powershell
# install
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# irm -useb get.scoop.sh | iex
irm https://ghfast.top/raw.githubusercontent.com/lzwme/scoop-proxy-cn/master/install.ps1 | iex

# config
scoop config SCOOP_REPO https://ghfast.top/github.com/ScoopInstaller/Scoop
scoop bucket add spc https://ghfast.top/github.com/lzwme/scoop-proxy-cn

# 从 0.4.0 开始，必须存在 main bucket，否则执行 scoop update 会报错：ERROR 'main' bucket not found. Failed to remove local 'main' bucket.
scoop bucket rm main
scoop bucket add main https://ghfast.top/github.com/ScoopInstaller/Main

# show help
scoop help

# install 7zip、aria2、scoop-search...
scoop install spc/7zip spc/aria2 spc/scoop-search
```

### 关于 `scoop-search`

由于 `scoop-proxy-cn` 仓库同步了 `1.4w+` 应用，官方的基于 `PowerShell` 编写的 `scoop search` 命令效率差到无法使用，推荐安装并使用基于 `go` 语言开发的 `scoop-search` 工具替代。示例：

```bash
scoop install scoop-search
# 使用 scoop-search
scoop-search act
```

## 常见问题

### 关于代理站失效需更新的处理方法

此情况下站点无法继续更新。请执行如下命令以重新添加：

```bash
# 先更新 scoop repo
scoop config scoop_repo https://ghfast.top/github.com/ScoopInstaller/Scoop.git

# 方法一：更新 spc bucket repo
git -C "$env:USERPROFILE\scoop\buckets\spc" remote set-url origin https://ghfast.top/github.com/lzwme/scoop-proxy-cn
# 如果修改了 buckets 的默认位置，则执行如下命令
git -C "$env:SCOOP\buckets\spc" remote set-url origin https://ghfast.top/github.com/lzwme/scoop-proxy-cn

# 方法二：移除并重新添加 spc bucket
scoop bucket rm spc
scoop bucket add spc https://ghfast.top/github.com/lzwme/scoop-proxy-cn
```


### 关于 `aria2` 导致的下载失败的问题

当安装了 `aria2` 时，scoop 会采用 `aria2` 实现分片加速下载。但部分代理地址不支持或屏蔽了来自 `aria2` 的分片下载请求，此时可以执行如下命令禁用 `aria2`：

```bash
scoop config aria2-enabled false
```

### 关于 `Hash Check Failed` 的问题

由于部分 app 配置的下载地址为最新发布地址，但同时又配置了 hash 值，当其有新版本变更时则会出现 `Hash Check Failed` 的问题。此时可以添加参数 `-s` 以忽略。示例：

```bash
scoop install scoop-search -s
```
## Sync Buckets From

- [ScoopInstaller/PHP](https://github.com/ScoopInstaller/PHP)
- [ScoopInstaller/Main](https://github.com/ScoopInstaller/Main)
- [ScoopInstaller/Extras](https://github.com/ScoopInstaller/Extras)
- [ScoopInstaller/Java](https://github.com/ScoopInstaller/Java)
- [ScoopInstaller/Versions](https://github.com/ScoopInstaller/Versions)
- [ScoopInstaller/Nirsoft](https://github.com/ScoopInstaller/Nirsoft)
- [ScoopInstaller/Nonportable](https://github.com/ScoopInstaller/Nonportable)
- [renxia/scoop-bucket](https://github.com/renxia/scoop-bucket)
- [scoopcn/scoopcn](https://github.com/scoopcn/scoopcn)
- [rasa/scoops](https://github.com/rasa/scoops)
- [amorphobia/siku](https://github.com/amorphobia/siku)
- [ACooper81/scoop-apps](https://github.com/ACooper81/scoop-apps)
- [kkzzhizhou/scoop-zapps](https://github.com/kkzzhizhou/scoop-zapps)
- [Calinou/scoop-games](https://github.com/Calinou/scoop-games)
- [cderv/r-bucket](https://github.com/cderv/r-bucket)
- [chawyehsu/dorado](https://github.com/chawyehsu/dorado)
- [borger/scoop-galaxy-integrations](https://github.com/borger/scoop-galaxy-integrations)
- [ivaquero/scoopet](https://github.com/ivaquero/scoopet)
- [KNOXDEV/wsl](https://github.com/KNOXDEV/wsl)
- [kodybrown/scoop-nirsoft](https://github.com/kodybrown/scoop-nirsoft)
- [kidonng/sushi](https://github.com/kidonng/sushi)
- [littleli/scoop-clojure](https://github.com/littleli/scoop-clojure)
- [niheaven/scoop-sysinternals](https://github.com/niheaven/scoop-sysinternals)
- [matthewjberger/scoop-nerd-fonts](https://github.com/matthewjberger/scoop-nerd-fonts)
- [TheCjw/scoop-retools](https://github.com/TheCjw/scoop-retools)
- [TheRandomLabs/Scoop-Bucket](https://github.com/TheRandomLabs/Scoop-Bucket)
- [TheRandomLabs/scoop-nonportable](https://github.com/TheRandomLabs/scoop-nonportable)
- [TheRandomLabs/Scoop-Spotify](https://github.com/TheRandomLabs/Scoop-Spotify)
- [Paxxs/Cluttered-bucket](https://github.com/Paxxs/Cluttered-bucket)
- [zhoujin7/tomato](https://github.com/zhoujin7/tomato)
- [HCLonely/my-scoop-bucket](https://github.com/HCLonely/my-scoop-bucket)
- [Weidows-projects/scoop-3rd](https://github.com/Weidows-projects/scoop-3rd)
- [hermanjustnu/scoop-emulators](https://github.com/hermanjustnu/scoop-emulators)
- [everyx/scoop-bucket](https://github.com/everyx/scoop-bucket)
- [borger/scoop-emulators](https://github.com/borger/scoop-emulators)
- [ZvonimirSun/scoop-iszy](https://github.com/ZvonimirSun/scoop-iszy)
- [kiennq/scoop-misc](https://github.com/kiennq/scoop-misc)
- [wzv5/ScoopBucket](https://github.com/wzv5/ScoopBucket)
- [TheRandomLabs/Scoop-Python](https://github.com/TheRandomLabs/Scoop-Python)
- [naderi/scoop-bucket](https://github.com/naderi/scoop-bucket)
- [ViCrack/scoop-bucket](https://github.com/ViCrack/scoop-bucket)
- [42wim/scoop-bucket](https://github.com/42wim/scoop-bucket)
- [akirco/aki-apps](https://github.com/akirco/aki-apps)
- [batkiz/backit](https://github.com/batkiz/backit)
- [iquiw/scoop-bucket](https://github.com/iquiw/scoop-bucket)
- [ygguorun/scoop-bucket](https://github.com/ygguorun/scoop-bucket)
- [seumsc/scoop-seu](https://github.com/seumsc/scoop-seu)
- [cc713/ownscoop](https://github.com/cc713/ownscoop)
- [aoisummer/scoop-bucket](https://github.com/aoisummer/scoop-bucket)
- [yuusakuri/scoop-bucket](https://github.com/yuusakuri/scoop-bucket)
- [hu3rror/scoop-muggle](https://github.com/hu3rror/scoop-muggle)
- [starise/Scoop-Confetti](https://github.com/starise/Scoop-Confetti)
- [dodorz/scoop](https://github.com/dodorz/scoop)
- [SayCV/scoop-cvp](https://github.com/SayCV/scoop-cvp)
- [Qv2ray/mochi](https://github.com/Qv2ray/mochi)
- [Homeland-Community/scoop](https://github.com/Homeland-Community/scoop)
- [jingyu9575/scoop-jingyu9575](https://github.com/jingyu9575/scoop-jingyu9575)
- [couleur-tweak-tips/utils](https://github.com/couleur-tweak-tips/utils)
- [wangzq/scoop-bucket](https://github.com/wangzq/scoop-bucket)
- [jonz94/scoop-sarasa-nerd-fonts](https://github.com/jonz94/scoop-sarasa-nerd-fonts)
- [NyaMisty/scoop_bucket_misty](https://github.com/NyaMisty/scoop_bucket_misty)
- [jfut/scoop-jfut](https://github.com/jfut/scoop-jfut)
- [mogeko/scoop-sysinternals](https://github.com/mogeko/scoop-sysinternals)
- [ChungZH/peach](https://github.com/ChungZH/peach)
- [DoveBoy/Apps](https://github.com/DoveBoy/Apps)
- [Velgus/Scoop-Portapps](https://github.com/Velgus/Scoop-Portapps)
- [starise/Scoop-Gaming](https://github.com/starise/Scoop-Gaming)
- [mo-san/scoop-bucket](https://github.com/mo-san/scoop-bucket)
- [brian6932/dank-scoop](https://github.com/brian6932/dank-scoop)
- [AkariiinMKII/Scoop4kariiin](https://github.com/AkariiinMKII/Scoop4kariiin)
- [littleli/Scoop-littleli](https://github.com/littleli/Scoop-littleli)
- [ChinLong/scoop-customize](https://github.com/ChinLong/scoop-customize)
- [Darkatse/Scoop-KanColle](https://github.com/Darkatse/Scoop-KanColle)
- [aliesbelik/poldi](https://github.com/aliesbelik/poldi)
- [MCOfficer/scoop-bucket](https://github.com/MCOfficer/scoop-bucket)
- [KnotUntied/scoop-fonts](https://github.com/KnotUntied/scoop-fonts)
- [beerpiss/scoop-bucket](https://github.com/beerpiss/scoop-bucket)
- [HUMORCE/nuke](https://github.com/HUMORCE/nuke)
- [AkinoKaede/maple](https://github.com/AkinoKaede/maple)
- [hulucc/bucket](https://github.com/hulucc/bucket)
- [Deide/deide-bucket](https://github.com/Deide/deide-bucket)
- [echoiron/echo-scoop](https://github.com/echoiron/echo-scoop)
- [tetradice/scoop-iyokan-jp](https://github.com/tetradice/scoop-iyokan-jp)

## 声明

> [!WARNING]
> 本仓库包含的应用信息仅从第三方仓库同步，未逐一作可用性、安全性验证，请在安装选择时自行验证识别。若有侵权请提 issues 处理。
