{
  "version": "5.1.0",
  "description": "Registry Workshop is an advanced registry editor. It is a perfect replacement for RegEdit and RegEdt32 which shipped with Windows.",
  "homepage": "http://www.torchsoft.com/en/rw_information.html",
  "license": {
    "identifier": "Proprietary",
    "url": "http://www.torchsoft.com/download/RegistryWorkshop_chs.exe"
  },
  "url": "http://www.torchsoft.com/download/RegistryWorkshop_chs.exe#/dl.7z",
  "hash": "13ebf41340bab067e407e06b5de4931bb80b79cc08fb8543b2913d9f3b5f81bb",
  "architecture": {
    "32bit": {
      "shortcuts": [
        [
          "RegWorkshop.exe",
          "RegWorkshop"
        ]
      ],
      "bin": [
        "RegWorkshop.exe"
      ]
    },
    "64bit": {
      "shortcuts": [
        [
          "RegWorkshopX64.exe",
          "RegWorkshop"
        ]
      ],
      "bin": [
        [
          "RegWorkshopX64.exe",
          "RegWorkshop"
        ]
      ]
    }
  },
  "persist": [
    "RegWorkshop.ini",
    "rwreg.txt",
    "undo.dat",
    "undo.idx"
  ],
  "pre_install": [
    "if (!(Test-Path \"$persist_dir\\RegWorkshop.ini\")) {",
    "    New-Item -Path \"$dir\\RegWorkshop.ini\" -ItemType File | Out-Null",
    "}",
    "if (!(Test-Path \"$persist_dir\\rwreg.txt\")) {",
    "    New-Item -Path \"$dir\\rwreg.txt\" -ItemType File | Out-Null",
    "}",
    "if (!(Test-Path \"$persist_dir\\undo.dat\")) {",
    "    New-Item -Path \"$dir\\undo.dat\" -ItemType File | Out-Null",
    "}",
    "if (!(Test-Path \"$persist_dir\\undo.idx\")) {",
    "    New-Item -Path \"$dir\\undo.idx\" -ItemType File | Out-Null",
    "}"
  ],
  "checkver": {
    "url": "http://www.torchsoft.com/en/download.html",
    "regex": "<td align=\"center\" valign=\"middle\">(?<version>(\\d+(\\.\\d+)+))</td>"
  },
  "autoupdate": {
    "url": "http://www.torchsoft.com/download/RegistryWorkshop_chs.exe#/dl.7z"
  }
}