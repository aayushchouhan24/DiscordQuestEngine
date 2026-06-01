param()

$ErrorActionPreference = 'Stop'

$discordSettings = Join-Path $env:APPDATA 'discord\settings.json'

if (-not (Test-Path $discordSettings)) {
    throw "Discord settings file not found at $discordSettings"
}

$backupPath = "$discordSettings.bak"
Copy-Item -Path $discordSettings -Destination $backupPath -Force

$settings = Get-Content -Path $discordSettings -Raw | ConvertFrom-Json
$settings | Add-Member -NotePropertyName 'DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING' -NotePropertyValue $true -Force

$settings | ConvertTo-Json -Depth 20 | Set-Content -Path $discordSettings -Encoding UTF8

Write-Host "Updated $discordSettings"
Write-Host "Backup saved to $backupPath"
Write-Host 'Restart Discord, then press Ctrl + Shift + I to open Developer Tools.'