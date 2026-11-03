<#
    persist-external.ps1
    --------------------
    Scoop 'persist_external' core implementation.
    Links external directories (outside $dir, e.g. %AppData%\Code) to $persist_dir
    via Junction for real-time persistence. Runs in parallel with native 'persist'.

    Licensed under the MIT License (see LICENSE in the repository root).
#>

# Capture absolute path of this script at top-level execution scope
$script:PersistExternalScriptPath = $PSCommandPath
if (-not $script:PersistExternalScriptPath) {
    $script:PersistExternalScriptPath = $MyInvocation.MyCommand.Path
}

# ---------------------------------------------------------------------------
# 0. Compatibility layer: prefer Scoop native warn/error/info functions
# ---------------------------------------------------------------------------
if (-not (Get-Command 'warn' -ErrorAction SilentlyContinue)) {
    function warn($msg) { Write-Warning $msg }
}
if (-not (Get-Command 'error' -ErrorAction SilentlyContinue)) {
    function error($msg) { Write-Host "ERROR $msg" -ForegroundColor DarkRed }
}
if (-not (Get-Command 'info' -ErrorAction SilentlyContinue)) {
    function info($msg) { Write-Host "INFO  $msg" -ForegroundColor DarkGray }
}

# Auto-bootstrap Scoop environment if running in a raw PowerShell session
function Initialize-ScoopEnvironment {
    [CmdletBinding()]
    param()

    # Skip if Scoop core functions are already loaded in current scope
    if ((Get-Command 'Select-CurrentVersion' -ErrorAction SilentlyContinue) -and (Get-Command 'add_alias' -ErrorAction SilentlyContinue)) {
        return
    }

    # Resolve Scoop root directory
    $scoopRoot = $env:SCOOP
    if (-not $scoopRoot -and $script:PersistExternalScriptPath) {
        $parentDir = Split-Path (Split-Path (Split-Path (Split-Path $script:PersistExternalScriptPath)))
        if ($parentDir -and (Test-Path -LiteralPath $parentDir)) {
            $scoopRoot = $parentDir
        }
    }
    if (-not $scoopRoot) {
        $scoopRoot = Join-Path $HOME 'scoop'
    }

    # Load all required core Scoop libraries into caller scope
    $libDir = Join-Path $scoopRoot 'apps\scoop\current\lib'
    foreach ($lib in 'core.ps1', 'buckets.ps1', 'versions.ps1', 'manifest.ps1', 'commands.ps1') {
        $libPath = Join-Path $libDir $lib
        if (Test-Path -LiteralPath $libPath) {
            . $libPath
        }
    }
}

# Normalize trailing path separators (preserve root paths like "C:\")
function ConvertTo-TrimmedPath {
    param([Parameter(Mandatory)][string]$Path)
    if ($Path.Length -gt 3) { return $Path.TrimEnd('\', '/') }
    return $Path
}

# ---------------------------------------------------------------------------
# 1. Path resolution: expand $env:VAR
# ---------------------------------------------------------------------------
function Convert-ExternalPath {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RawPath)

    $p = $RawPath.Trim()

    $p = [regex]::Replace($p, '\$env:(?<name>[\w()]+)', {
            param($m)
            $varName = $m.Groups['name'].Value
            $val = [Environment]::GetEnvironmentVariable($varName)
            if ([string]::IsNullOrEmpty($val)) {
                throw "persist_external: Unknown environment variable `$env:$($varName) (Source path: $RawPath)"
            }
            $val
        }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    if (-not [System.IO.Path]::IsPathRooted($p)) {
        throw "persist_external: Path '$RawPath' expanded to non-absolute path '$p'. Please check if `$env: prefix is missing."
    }

    return [System.IO.Path]::GetFullPath($p)
}

# ---------------------------------------------------------------------------
# 2. Parse Manifest definitions
# ---------------------------------------------------------------------------
function Get-PersistExternalDefinition {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Manifest)

    $raw = $Manifest.persist_external
    if (-not $raw) { return @() }
    if ($raw -isnot [array]) { $raw = @($raw) }

    $result = @()
    foreach ($item in $raw) {
        if ($item -is [array]) {
            $sourceRaw = $item[0]
            $targetName = $item[1]
            if ($item.Count -ge 3 -and $item[2]) {
                if ($item[2] -notmatch '^(dir|directory)$') {
                    throw "persist_external: Unknown type hint '$($item[2])', must be 'directory' (alias 'dir')"
                }
            }
        } else {
            $sourceRaw = $item
            $targetName = $null
        }

        $source = Convert-ExternalPath -RawPath $sourceRaw
        if (-not $targetName) {
            $targetName = Split-Path $source -Leaf
        }

        $result += [PSCustomObject]@{
            Source     = $source
            TargetName = $targetName
        }
    }
    return $result
}

# ---------------------------------------------------------------------------
# 3. Persistence record (.scoop-persist-external.json)
# ---------------------------------------------------------------------------
function Get-ExternalLinkRecordPath {
    param([Parameter(Mandatory)][string]$PersistDir)
    Join-Path $PersistDir '.scoop-persist-external.json'
}

function Get-LegacyExternalLinkRecordPath {
    param([string]$Dir)
    if (-not $Dir) { return $null }
    Join-Path $Dir '.scoop-persist-external.json'
}

function Save-ExternalLinkRecord {
    param(
        [Parameter(Mandatory)][string]$PersistDir,
        [Parameter(Mandatory)][array]$Records
    )
    $path = Get-ExternalLinkRecordPath -PersistDir $PersistDir
    $json = ConvertTo-Json -InputObject @($Records) -Depth 5
    if (Get-Command 'Out-UTF8File' -ErrorAction SilentlyContinue) {
        $json | Out-UTF8File -FilePath $path
    } else {
        [System.IO.File]::WriteAllText($path, $json, [System.Text.Encoding]::UTF8)
    }
}

function Read-ExternalLinkRecord {
    param(
        [Parameter(Mandatory)][string]$PersistDir,
        [string]$Dir
    )
    $candidates = @(
        (Get-ExternalLinkRecordPath -PersistDir $PersistDir),
        (Get-LegacyExternalLinkRecordPath -Dir $Dir)
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
    if (-not $candidates) { return $null }
    foreach ($path in $candidates) {
        try {
            $content = Get-Content -LiteralPath $path -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
            if ($content -isnot [array]) { $content = @($content) }
            return @($content | ForEach-Object { if ($_ -is [string]) { $_ } else { $_.Source } })
        } catch {
            warn "persist_external: Failed to read link record '$path': $_"
        }
    }
    return $null
}

function Remove-ExternalLinkRecord {
    param(
        [Parameter(Mandatory)][string]$PersistDir,
        [string]$Dir,
        [switch]$PersistOnly
    )
    $paths = @((Get-ExternalLinkRecordPath -PersistDir $PersistDir))
    if (-not $PersistOnly) {
        $paths += Get-LegacyExternalLinkRecordPath -Dir $Dir
    }
    foreach ($path in $paths) {
        if ($path -and (Test-Path -LiteralPath $path)) {
            Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
        }
    }
}

function Resolve-ExternalPersistDir {
    param([Parameter(Mandatory)][string]$Dir)
    $cleanDir = ConvertTo-TrimmedPath -Path $Dir
    $appDir = Split-Path -Parent $cleanDir
    $appsDir = Split-Path -Parent $appDir
    $scoopRoot = Split-Path -Parent $appsDir
    Join-Path (Join-Path $scoopRoot 'persist') (Split-Path -Leaf $appDir)
}

# ---------------------------------------------------------------------------
# 4. Safe link removal
#    Remove ReadOnly attribute and call .NET API to prevent Remove-Item recursion risk
# ---------------------------------------------------------------------------
function Remove-ReparsePointSafe {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)

    $CleanPath = ConvertTo-TrimmedPath -Path $Path
    # Use Get-Item -Force to get physical node, preventing Test-Path $false on dangling links
    $item = Get-Item -LiteralPath $CleanPath -Force -ErrorAction SilentlyContinue
    if ($null -eq $item) { return $false }

    # Safety check: never delete non-link items
    if (-not $item.LinkType) { return $false }

    # Remove ReadOnly attribute to prevent UnauthorizedAccessException
    if ($item.Attributes -band [System.IO.FileAttributes]::ReadOnly) {
        $item.Attributes = $item.Attributes -band -bnot [System.IO.FileAttributes]::ReadOnly
    }

    if ($item.PSIsContainer) {
        # .NET Directory.Delete on Junction only removes the reparse point itself
        [System.IO.Directory]::Delete($CleanPath)
    } else {
        [System.IO.File]::Delete($CleanPath)
    }
    return $true
}

# ---------------------------------------------------------------------------
# 5. Core linking logic
# ---------------------------------------------------------------------------
function New-ExternalPersistLink {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$PersistTarget
    )

    $Source = ConvertTo-TrimmedPath -Path $Source
    $PersistTarget = ConvertTo-TrimmedPath -Path $PersistTarget

    $sourceItem = Get-Item -LiteralPath $Source -Force -ErrorAction SilentlyContinue
    $targetItem = Get-Item -LiteralPath $PersistTarget -Force -ErrorAction SilentlyContinue
    if ($null -ne $sourceItem -and -not $sourceItem.PSIsContainer) {
        throw "persist_external: '$Source' is a file; only directories are supported."
    }
    $sourceIsLink = ($null -ne $sourceItem) -and [bool]$sourceItem.LinkType
    $sourceIsRealData = ($null -ne $sourceItem) -and (-not $sourceItem.LinkType)

    # 1. Idempotency check: skip if already linked to target
    if ($sourceIsLink) {
        $currentTarget = @($sourceItem.Target)[0]
        if ($currentTarget) {
            $normCurrent = [System.IO.Path]::GetFullPath(($currentTarget -replace '^\\\\\?\\', ''))
            $normPersist = [System.IO.Path]::GetFullPath($PersistTarget)
            if ($normCurrent -eq $normPersist -and ($null -ne $targetItem)) {
                Write-Verbose "persist_external: '$Source' is already linked to '$PersistTarget'"
                return
            }
        }
    }

    # 2. Target in persist directory does not exist
    if ($null -eq $targetItem) {
        $targetParent = Split-Path $PersistTarget -Parent
        if (-not (Test-Path -LiteralPath $targetParent)) {
            New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
        }

        if ($sourceIsRealData) {
            # Only migrate real data, never run Move-Item on dangling links
            Move-Item -LiteralPath $Source -Destination $PersistTarget -Force
            $sourceItem = $null
            $sourceIsRealData = $false
        } else {
            if ($sourceIsLink) {
                Remove-ReparsePointSafe -Path $Source | Out-Null
                $sourceItem = $null
                $sourceIsLink = $false
            }
            New-Item -ItemType Directory -Path $PersistTarget -Force | Out-Null
        }
        $targetItem = Get-Item -LiteralPath $PersistTarget -Force -ErrorAction Stop
    }

    # 3. Handle conflict: real data exists in both source and persist dir
    if ($sourceIsRealData) {
        $backup = "$Source.pre-persist-backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
        warn "persist_external: '$Source' conflicts with existing persist data, backed up to '$backup'"
        Move-Item -LiteralPath $Source -Destination $backup -Force
        $sourceItem = $null
        $sourceIsRealData = $false
    }

    # 4. Clean dangling or old links in source
    if ($null -ne (Get-Item -LiteralPath $Source -Force -ErrorAction SilentlyContinue)) {
        Remove-ReparsePointSafe -Path $Source | Out-Null
    }

    # 5. Ensure source parent directory exists
    $sourceParent = Split-Path $Source -Parent
    if (-not (Test-Path -LiteralPath $sourceParent)) {
        New-Item -ItemType Directory -Path $sourceParent -Force | Out-Null
    }

    if (-not $targetItem.PSIsContainer) {
        throw "persist_external: '$PersistTarget' is a file; only directories are supported."
    }

    # 6. Create the junction
    if (Get-Command 'New-DirectoryJunction' -ErrorAction SilentlyContinue) {
        New-DirectoryJunction $Source $PersistTarget | Out-Null
    } else {
        New-Item -ItemType Junction -Path $Source -Target $PersistTarget -Force | Out-Null
    }

}

# ---------------------------------------------------------------------------
# 6. Reconcile (sole owner of the link record)
# ---------------------------------------------------------------------------
function Remove-ExternalLink {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Source)

    $removed = Remove-ReparsePointSafe -Path $Source
    if ($removed) {
        Write-Verbose "persist_external: Removed external link '$Source'"
    } elseif ($null -ne (Get-Item -LiteralPath $Source -Force -ErrorAction SilentlyContinue)) {
        warn "persist_external: '$Source' is not expected link, skipped to protect real data"
    }
}

function Remove-PersistExternalLinks {
    [CmdletBinding()]
    param(
        $Manifest,
        [string]$PersistDir,
        [string]$Dir
    )

    $records = Read-ExternalLinkRecord -PersistDir $PersistDir -Dir $Dir
    if ($null -eq $records) {
        warn "persist_external: Installation record not found, falling back to manifest parsing"
        $sources = @(Get-PersistExternalDefinition -Manifest $Manifest | ForEach-Object { $_.Source })
    } else {
        $sources = @($records)
    }
    foreach ($source in ($sources | Select-Object -Unique)) {
        Remove-ExternalLink -Source $source
    }
    Remove-ExternalLinkRecord -PersistDir $PersistDir -Dir $Dir
}

function Invoke-PersistExternalReconcile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Manifest,
        [Parameter(Mandatory)][string]$PersistDir,
        [string]$Dir,
        [switch]$Remove
    )

    if ($Remove) {
        Remove-PersistExternalLinks -Manifest $Manifest -PersistDir $PersistDir -Dir $Dir
        return
    }

    $defs = @(Get-PersistExternalDefinition -Manifest $Manifest)
    if (-not $defs) {
        Remove-PersistExternalLinks -Manifest $Manifest -PersistDir $PersistDir -Dir $Dir
        return
    }

    $desired = @($defs | ForEach-Object {
        [PSCustomObject]@{
            Source   = $_.Source
            Target   = ConvertTo-TrimmedPath -Path (Join-Path $PersistDir $_.TargetName)
        }
    })

    $recorded = Read-ExternalLinkRecord -PersistDir $PersistDir -Dir $Dir
    foreach ($entry in $recorded) {
        if ($desired.Source -notcontains $entry) {
            Remove-ExternalLink -Source $entry
        }
    }

    if (Test-Path -LiteralPath $PersistDir) {
        $existingItems = Get-ChildItem -LiteralPath $PersistDir -Force -ErrorAction SilentlyContinue
        foreach ($item in $existingItems) {
            # Skip internal record file
            if ($item.Name -eq '.scoop-persist-external.json') { continue }

            $itemPath = ConvertTo-TrimmedPath -Path $item.FullName
            if ($desired.Target -notcontains $itemPath) {
                warn "persist_external: Found unmapped persist item '$($item.Name)' in '$PersistDir'. If this item contains previous data, you may need to manually migrate it."
            }
        }
    }

    $records = @()
    foreach ($d in $desired) {
        try {
            New-ExternalPersistLink -Source $d.Source -PersistTarget $d.Target
            $records += $d.Source
        } catch {
            # Log error on individual failure and continue processing remaining items
            error "persist_external: Failed to process '$($d.Source)': $_"
        }
    }

    if ($records) {
        Save-ExternalLinkRecord -PersistDir $PersistDir -Records $records
        $legacyPath = Get-LegacyExternalLinkRecordPath -Dir $Dir
        if ($legacyPath -and (Test-Path -LiteralPath $legacyPath)) {
            Remove-Item -LiteralPath $legacyPath -Force -ErrorAction SilentlyContinue
        }
    } else {
        Remove-ExternalLinkRecord -PersistDir $PersistDir -PersistOnly
    }
}

# ---------------------------------------------------------------------------
# 7. Public entry points
# ---------------------------------------------------------------------------
function Initialize-PersistExternalAlias {
    [CmdletBinding()]
    param()

    . Initialize-ScoopEnvironment

    $aliasName = 'persist-external-reset'
    $shimPath = Join-Path (shimdir $false) "scoop-$aliasName.ps1"

    # Skip if alias shim already exists
    if (Test-Path -LiteralPath $shimPath) {
        return
    }

    $scriptPath = $script:PersistExternalScriptPath
    if (-not $scriptPath -or -not (Test-Path -LiteralPath $scriptPath)) {
        if ($PSScriptRoot) {
            $scriptPath = Join-Path $PSScriptRoot 'persist-external.ps1'
        }
    }

    if (-not $scriptPath -or -not (Test-Path -LiteralPath $scriptPath)) {
        warn "persist_external: Could not resolve script path to register alias '$aliasName'."
        return
    }

    $command = ". `"$scriptPath`"; Invoke-PersistExternalReset @args"
    $description = 'Reset persist_external links for installed apps'

    try {
        add_alias $aliasName $command $description
        info "persist_external: Automatically registered Scoop alias '$aliasName'."
    } catch {
        warn "persist_external: Skip registering alias '$aliasName': $_"
    }
}

function Invoke-PersistExternalInstall {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Manifest,
        [Parameter(Mandatory)][string]$PersistDir,
        [string]$Dir
    )

    Initialize-PersistExternalAlias

    Invoke-PersistExternalReconcile -Manifest $Manifest -PersistDir $PersistDir -Dir $Dir
}

function Invoke-PersistExternalUninstall {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Manifest,
        [Parameter(Mandatory)][string]$Dir,
        [string]$PersistDir
    )

    if (-not $PersistDir) {
        $PersistDir = Resolve-ExternalPersistDir -Dir $Dir
    }

    Invoke-PersistExternalReconcile -Manifest $Manifest -PersistDir $PersistDir -Dir $Dir -Remove
}

# ---------------------------------------------------------------------------
# 8. Reset entry point
# ---------------------------------------------------------------------------
function Invoke-PersistExternalReset {
    [CmdletBinding()]
    param(
        [Parameter(Position = 0)]
        [string]$AppName,
        [switch]$Global
    )

    . Initialize-ScoopEnvironment

    # Re-register Scoop alias if missing
    Initialize-PersistExternalAlias

    $isGlobal = [bool]$Global

    $appsToProcess = @()
    if ($AppName -and $AppName -ne '*') {
        $appsToProcess += $AppName
    } else {
        $appsToProcess = installed_apps $isGlobal
    }

    foreach ($app in $appsToProcess) {
        $version = Select-CurrentVersion -AppName $app -Global:$isGlobal
        if (-not $version) {
            if ($AppName -and $AppName -ne '*') {
                warn "persist_external: App '$app' is not installed $(if ($isGlobal) { 'globally' } else { 'locally' })."
            }
            continue
        }

        $dir = currentdir $app $isGlobal

        $manifest = installed_manifest $app $version $isGlobal
        if (-not $manifest) {
            warn "persist_external: Manifest for '$app' ($version) could not be loaded."
            continue
        }

        # Only target apps that declare persist_external in their manifest
        if (-not $manifest.persist_external) {
            if ($AppName -and $AppName -ne '*') {
                info "persist_external: App '$app' does not declare persist_external."
            }
            continue
        }

        $persistDir = persistdir $app $isGlobal

        Write-Host "Resetting persist_external links for '$app' ($version)..."
        Invoke-PersistExternalReconcile -Manifest $manifest -PersistDir $persistDir -Dir $dir
    }
}
