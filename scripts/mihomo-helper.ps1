[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'enable', 'disable', 'log')]
    [string]$Action = 'status',

    [Parameter()]
    [switch]$Tail
)

$ServiceName = 'mihomo-shawl'

function Test-Admin {
    ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 需要管理员权限的动作队列
$ElevatedActions = @('start', 'stop', 'restart', 'enable', 'disable')

# 自提权机制（Self-Elevation）：不使用 Invoke-Expression，安全且符合官方标准
if ($Action -in $ElevatedActions -and -not (Test-Admin)) {
    Write-Host "Action '$Action' requires Administrator privileges. Requesting UAC elevation..." -ForegroundColor Yellow
    try {
        $arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$PSCommandPath`"", $Action)
        if ($Tail) { $arguments += "-Tail" }
        Start-Process powershell -ArgumentList $arguments -Verb RunAs -Wait -ErrorAction Stop
    } catch {
        Write-Error "UAC elevation denied or failed."
    }
    return
}

switch ($Action) {
    'status' {
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if (!$service) {
            Write-Host "Service '$ServiceName' is not registered." -ForegroundColor Red
            return
        }
        $statusColor = if ($service.Status -eq 'Running') { 'Green' } else { 'Yellow' }
        Write-Host "Service Name: " -NoNewline; Write-Host $service.Name -ForegroundColor Cyan
        Write-Host "Status:       " -NoNewline; Write-Host $service.Status -ForegroundColor $statusColor
        Write-Host "Start Type:   " -NoNewline; Write-Host $service.StartType -ForegroundColor Cyan
    }
    'start' {
        Start-Service -Name $ServiceName -ErrorAction Stop
    }
    'stop' {
        Stop-Service -Name $ServiceName -Force -ErrorAction Stop
    }
    'restart' {
        Restart-Service -Name $ServiceName -Force -ErrorAction Stop
    }
    'enable' {
        sc.exe config $ServiceName start= auto | Out-Null
        Write-Host "Service configured to start automatically on boot." -ForegroundColor Green
    }
    'disable' {
        sc.exe config $ServiceName start= demand | Out-Null
        Write-Host "Service configured to manual start." -ForegroundColor Yellow
    }
    'log' {
        $logPath = Join-Path $PSScriptRoot "logs\mihomo-shawl.stdout.log"
        if (!(Test-Path $logPath)) {
            $logPath = Join-Path $PSScriptRoot "logs\mihomo-shawl.log"
        }
        if (!(Test-Path $logPath)) {
            Write-Host "No log file found under logs directory." -ForegroundColor Red
            return
        }

        if ($Tail) {
            Get-Content -Path $logPath -Tail 50 -Wait
        } else {
            Get-Content -Path $logPath -Tail 100
        }
    }
}
