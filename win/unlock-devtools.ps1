param()

$ErrorActionPreference = 'Stop'

$paths = @(
    "$env:APPDATA\discord\settings.json",
    "$env:APPDATA\discordptb\settings.json",
    "$env:APPDATA\discordcanary\settings.json"
)

$foundAny = $false

foreach ($discordSettings in $paths) {
    if (Test-Path $discordSettings) {
        $foundAny = $true
        $backupPath = "$discordSettings.bak"
        Copy-Item -Path $discordSettings -Destination $backupPath -Force

        $settings = Get-Content -Path $discordSettings -Raw | ConvertFrom-Json
        $settings | Add-Member -NotePropertyName 'DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING' -NotePropertyValue $true -Force

        $jsonString = $settings | ConvertTo-Json -Depth 20
        $jsonString = $jsonString -replace '\{\s+\}', '{}' -replace '\[\s+\]', '[]'
        [System.IO.File]::WriteAllText($discordSettings, $jsonString)

        Write-Host "Updated $discordSettings"
        Write-Host "Backup saved to $backupPath"
    }
}

if (-not $foundAny) {
    Write-Host "Discord settings file not found in AppData." -ForegroundColor Red
} else {
    Write-Host 'Restart Discord, then press Ctrl + Shift + I to open Developer Tools.' -ForegroundColor Green
}