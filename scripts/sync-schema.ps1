<#
    sync-schema.ps1
    ---------------
    Builds the manifest schema used by Scoop-Bucket.Tests.ps1.

    Fetches the official Scoop schema (master) at test time and injects the
    bucket-specific `persist_external` property, so the bucket no longer holds
    a static schema copy that drifts from upstream. See docs/adr/0001.

    Usage:
        .\scripts\sync-schema.ps1 -TargetPath <path>

    Behaviour:
      - Fetch OK            -> write injected schema to TargetPath, refresh cache
      - Fetch fail + cache  -> reuse cached injected schema, warn
      - Fetch fail, no cache-> throw (test chain fails loudly)

    The cache lives outside any git worktree (LOCALAPPDATA), because TargetPath
    is normally the scoop core clone's schema.json and Scoop-Bucket.Tests.ps1
    restores it after the run.
#>

param(
    [Parameter(Mandatory = $true)][string]$TargetPath,
    [string]$OfficialUrl = 'https://raw.githubusercontent.com/ScoopInstaller/Scoop/master/schema.json'
)

$ErrorActionPreference = 'Stop'

$cacheDir = if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } else { [System.IO.Path]::GetTempPath() }
$schemaCachePath = Join-Path (Join-Path $cacheDir 'muggle-scoop') 'schema.injected.json'

function Get-InjectedSchemaText {
    param([string]$JsonUrl)

    $tmp = Join-Path $env:TEMP "official-schema-$([guid]::NewGuid().ToString('N')).json"
    try {
        & curl.exe -fsSL --retry 3 $JsonUrl -o $tmp
        if ($LASTEXITCODE -ne 0) { throw "curl exited with code $LASTEXITCODE" }

        $schema = Get-Content -LiteralPath $tmp -Raw | ConvertFrom-Json
        $properties = $schema.properties
        if (-not ($properties.PSObject.Properties.Name -contains 'persist_external')) {
            $properties | Add-Member -NotePropertyName 'persist_external' `
                -NotePropertyValue @{ '$ref' = '#/definitions/stringOrArrayOfStringsOrAnArrayOfArrayOfStrings' } `
                -Force
        }
        return ($schema | ConvertTo-Json -Depth 20)
    } finally {
        Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
    }
}

$targetDir = Split-Path $TargetPath -Parent
if ($targetDir -and -not (Test-Path -LiteralPath $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

try {
    $json = Get-InjectedSchemaText -JsonUrl $OfficialUrl
    [System.IO.File]::WriteAllText($TargetPath, $json, [System.Text.Encoding]::UTF8)
    New-Item -ItemType Directory -Path (Split-Path $schemaCachePath -Parent) -Force | Out-Null
    [System.IO.File]::WriteAllText($schemaCachePath, $json, [System.Text.Encoding]::UTF8)
    Write-Host "sync-schema: wrote injected schema to '$TargetPath'"
} catch {
    if ((Test-Path -LiteralPath $schemaCachePath) -and
        ([System.IO.File]::ReadAllText($schemaCachePath).Contains('persist_external'))) {
        $cached = [System.IO.File]::ReadAllText($schemaCachePath)
        [System.IO.File]::WriteAllText($TargetPath, $cached, [System.Text.Encoding]::UTF8)
        Write-Warning "sync-schema: fetch failed ($($_.Exception.Message)); reusing cached injected schema at '$schemaCachePath'"
        exit 0
    } else {
        throw "sync-schema: failed to fetch '$OfficialUrl' and no usable injected cache at '$schemaCachePath': $($_.Exception.Message)"
    }
}
