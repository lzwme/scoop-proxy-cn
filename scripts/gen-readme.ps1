$result = "# Personal Scoop bucket

[![AppVeyor Build](https://img.shields.io/appveyor/build/iquiw/scoop-bucket?style=flat-square)](https://ci.appveyor.com/project/iquiw/scoop-bucket/branch/master)

## Applications

| Name | Description | Unofficial binary |
| ---  | ---         | ---               |
"

$files = Get-ChildItem bucket

foreach ($file in $files) {
    $path = Join-Path -Path "bucket" -ChildPath $file
    $name = $file -replace "\.json$", ''
    $json = Get-Content $path | ConvertFrom-Json
    $homepage = $json.homepage
    $descr = $json.description
    $unofficial = ''
    if ($homepage -match "github.com/iquiw/.*-(binary|dll)" -and
        $name -ne 'rireq') {
        $unofficial = 'O'
    }
    $result += "| [$name]($homepage) | $descr | $unofficial |`r`n"
}

$result | Set-Content README.md
