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

- [ScoopInstaller/PHP](https://github.com/ScoopInstaller/PHP)
- [ScoopInstaller/Main](https://github.com/ScoopInstaller/Main)
- [ScoopInstaller/Extras](https://github.com/ScoopInstaller/Extras)
- [ScoopInstaller/Java](https://github.com/ScoopInstaller/Java)
- [ScoopInstaller/Versions](https://github.com/ScoopInstaller/Versions)
- [ScoopInstaller/Nirsoft](https://github.com/ScoopInstaller/Nirsoft)
- [ScoopInstaller/Nonportable](https://github.com/ScoopInstaller/Nonportable)
- [scoopcn/scoopcn.git](https://github.com/scoopcn/scoopcn.git)
- [kodybrown/scoop-nirsoft](https://github.com/kodybrown/scoop-nirsoft)
- [niheaven/scoop-sysinternals](https://github.com/niheaven/scoop-sysinternals)
- [chawyehsu/dorado](https://github.com/chawyehsu/dorado)
- [matthewjberger/scoop-nerd-fonts](https://github.com/matthewjberger/scoop-nerd-fonts)
- [kkzzhizhou/scoop-apps](https://github.com/kkzzhizhou/scoop-apps)
- [Calinou/scoop-games](https://github.com/Calinou/scoop-games)
- [ivaquero/scoopet](https://github.com/ivaquero/scoopet)
- [TheRandomLabs/Scoop-Spotify](https://github.com/TheRandomLabs/Scoop-Spotify)
- [borger/scoop-galaxy-integrations](https://github.com/borger/scoop-galaxy-integrations)
- [TheRandomLabs/scoop-nonportable](https://github.com/TheRandomLabs/scoop-nonportable)
- [TheCjw/scoop-retools](https://github.com/TheCjw/scoop-retools)
- [littleli/scoop-clojure](https://github.com/littleli/scoop-clojure)
- [kidonng/sushi](https://github.com/kidonng/sushi)
- [rasa/scoops](https://github.com/rasa/scoops)
- [kkzzhizhou/scoop-zapps](https://github.com/kkzzhizhou/scoop-zapps)
- [anderlli0053/DEV-tools](https://github.com/anderlli0053/DEV-tools)
- [KNOXDEV/wsl](https://github.com/KNOXDEV/wsl)
- [hoilc/scoop-lemon](https://github.com/hoilc/scoop-lemon)
- [Paxxs/Cluttered-bucket](https://github.com/Paxxs/Cluttered-bucket)
- [cderv/r-bucket](https://github.com/cderv/r-bucket)
- [tetradice/scoop-iyokan-jp](https://github.com/tetradice/scoop-iyokan-jp)
- [TheRandomLabs/Scoop-Bucket](https://github.com/TheRandomLabs/Scoop-Bucket)
- [ACooper81/scoop-apps](https://github.com/ACooper81/scoop-apps)
- [Qv2ray/mochi](https://github.com/Qv2ray/mochi)
- [duzyn/scoop-cn](https://github.com/duzyn/scoop-cn)
- [zhoujin7/tomato](https://github.com/zhoujin7/tomato)

## 声明

本仓库包含的应用信息仅从第三方仓库同步，未逐一作可用性、安全性验证，请在安装选择时自行验证识别。若有侵权请提 issues 处理。
