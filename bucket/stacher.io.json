{
  "version": "6.0.14",
  "homepage": "https://stacher.io/",
  "description": "A Beautiful, Modern GUI for YT-DLP / YOUTUBE-DL.",
  "license": "CC-BY-NC-ND-4.0",
  "architecture": {
    "64bit": {
      "url": "https://cdn.stacher.io/builds/StacherSetup.exe#/dl.7z",
      "hash": "fad2feae60982dc518543f6c3f64d0ee42b2c61ec37a9e9e2bfbba564f683e5f"
    }
  },
  "pre_install": [
    "Remove-Item \"$dir\\Update.exe\"; Get-ChildItem \"$dir\\Stacher-*-full.nupkg\" | Rename-Item -NewName 'StacherFull.nupkg'",
    "Expand-7zipArchive \"$dir\\StacherFull.nupkg\" \"$dir\" -ExtractDir 'lib\\net45' -Removal"
  ],
  "shortcuts": [
    [
      "Stacher.exe",
      "Stacher.io"
    ]
  ],
  "checkver": {
    "url": "https://stacher.io/version.php",
    "regex": "([\\d.]+)"
  },
  "autoupdate": {
    "architecture": {
      "64bit": {
        "url": "https://cdn.stacher.io/builds/StacherSetup.exe#/dl.7z"
      }
    }
  }
}