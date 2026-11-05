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
            $definitions = $schema.definitions
            if (-not ($definitions.PSObject.Properties.Name -contains 'persistExternalEntry')) {
                $definitions | Add-Member -NotePropertyName 'persistExternalEntry' -NotePropertyValue @{
                    oneOf = @(
                        @{ type = 'string' },
                        @{
                            type            = 'array'
                            minItems        = 2
                            maxItems        = 3
                            additionalItems = $false
                            items           = @(
                                @{ type = 'string' },
                                @{ type = 'string' },
                                @{ enum = @('dir', 'directory') }
                            )
                        }
                    )
                } -Force
            }
            $properties | Add-Member -NotePropertyName 'persist_external' -NotePropertyValue @{
                'description' = 'Bucket-specific: external data directories this bucket persists through junctions into the persist directory.'
                '$type'       = 'array'
                anyOf         = @(
                    @{ '$ref' = '#/definitions/persistExternalEntry' },
                    @{ type = 'array'; minItems = 1; items = @{ '$ref' = '#/definitions/persistExternalEntry' } }
                )
            } -Force
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
