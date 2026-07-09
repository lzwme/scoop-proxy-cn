Remove-NetFirewallRule -Description "Work with Clash for Windows from scoop bucket Scoop4kariiin." -ErrorAction SilentlyContinue
'TCP', 'UDP' | ForEach-Object {
    New-NetFirewallRule `
        -DisplayName "Clash for Windows" `
        -Profile "Private, Public" `
        -Description "Work with Clash for Windows from scoop bucket Scoop4kariiin." `
        -Direction Inbound `
        -Protocol $_ `
        -Action Allow `
        -Program "$CFWPath" `
        -EdgeTraversalPolicy DeferToUser `
    | Out-Null
    New-NetFirewallRule `
        -DisplayName "Clash Core" `
        -Profile "Private, Public" `
        -Description "Work with Clash for Windows from scoop bucket Scoop4kariiin." `
        -Direction Inbound `
        -Protocol $_ `
        -Action Allow `
        -Program "$CorePath" `
    | Out-Null
}
