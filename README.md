# 🍡 Scoop-proxy-cn

适合中国大陆的 [Scoop](https://scoop.sh) buckets 代理镜像库。从多个开源 `bucket` 仓库同步更新，并将从 `github release` 下载的应用地址修改为基于 `ghporxy.com` 的代理下载地址。

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

由于 `scoop-proxy-cn` 仓库同步了 1w+ 应用，官方的 `scoop search` 命令是基于 `powershell` 编写的，在查找效率上非常低，推荐安装并使用 `scoop-search` 工具。示例：

```bash
scoop install scoop-search
# 使用 scoop-search
scoop-search act
```

## Sync Buckets From

- [https://github.com/ScoopInstaller/PHP](https://github.com/ScoopInstaller/PHP)
- [https://github.com/ScoopInstaller/Main](https://github.com/ScoopInstaller/Main)
- [https://github.com/ScoopInstaller/Extras](https://github.com/ScoopInstaller/Extras)
- [https://github.com/ScoopInstaller/Java](https://github.com/ScoopInstaller/Java)
- [https://github.com/ScoopInstaller/Versions](https://github.com/ScoopInstaller/Versions)
- [https://github.com/ScoopInstaller/Nirsoft](https://github.com/ScoopInstaller/Nirsoft)
- [https://github.com/ScoopInstaller/Nonportable](https://github.com/ScoopInstaller/Nonportable)
- [https://github.com/scoopcn/scoopcn.git](https://github.com/scoopcn/scoopcn.git)
- [https://github.com/kodybrown/scoop-nirsoft](https://github.com/kodybrown/scoop-nirsoft)
- [https://github.com/niheaven/scoop-sysinternals](https://github.com/niheaven/scoop-sysinternals)
- [https://github.com/chawyehsu/dorado](https://github.com/chawyehsu/dorado)
- [https://github.com/matthewjberger/scoop-nerd-fonts](https://github.com/matthewjberger/scoop-nerd-fonts)
- [https://github.com/kkzzhizhou/scoop-apps](https://github.com/kkzzhizhou/scoop-apps)
- [https://github.com/Calinou/scoop-games](https://github.com/Calinou/scoop-games)
- [https://github.com/ivaquero/scoopet](https://github.com/ivaquero/scoopet)
- [https://github.com/TheRandomLabs/Scoop-Spotify](https://github.com/TheRandomLabs/Scoop-Spotify)
- [https://github.com/borger/scoop-galaxy-integrations](https://github.com/borger/scoop-galaxy-integrations)
- [https://github.com/TheRandomLabs/scoop-nonportable](https://github.com/TheRandomLabs/scoop-nonportable)
- [https://github.com/TheCjw/scoop-retools](https://github.com/TheCjw/scoop-retools)
- [https://github.com/littleli/scoop-clojure](https://github.com/littleli/scoop-clojure)
- [https://github.com/kidonng/sushi](https://github.com/kidonng/sushi)
- [https://github.com/rasa/scoops](https://github.com/rasa/scoops)
- [https://github.com/kkzzhizhou/scoop-zapps](https://github.com/kkzzhizhou/scoop-zapps)
- [https://github.com/Ash258/GenericBucket](https://github.com/Ash258/GenericBucket)
- [https://github.com/anderlli0053/DEV-tools](https://github.com/anderlli0053/DEV-tools)
- [https://github.com/KNOXDEV/wsl](https://github.com/KNOXDEV/wsl)
- [https://github.com/hoilc/scoop-lemon](https://github.com/hoilc/scoop-lemon)
- [https://github.com/Paxxs/Cluttered-bucket](https://github.com/Paxxs/Cluttered-bucket)
- [https://github.com/cderv/r-bucket](https://github.com/cderv/r-bucket)
- [https://github.com/tetradice/scoop-iyokan-jp](https://github.com/tetradice/scoop-iyokan-jp)
- [https://github.com/TheRandomLabs/Scoop-Bucket](https://github.com/TheRandomLabs/Scoop-Bucket)
- [https://github.com/ACooper81/scoop-apps](https://github.com/ACooper81/scoop-apps)
- [https://github.com/Qv2ray/mochi](https://github.com/Qv2ray/mochi)
- [https://github.com/duzyn/scoop-cn](https://github.com/duzyn/scoop-cn)

## License

[GPL-3.0](LICENSE)
