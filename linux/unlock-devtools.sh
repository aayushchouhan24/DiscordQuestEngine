#!/usr/bin/env bash
set -euo pipefail

settings_files=(
  "$HOME/.config/discord/settings.json"
  "$HOME/.config/discordptb/settings.json"
  "$HOME/.config/discordcanary/settings.json"
  "$HOME/.var/app/com.discordapp.Discord/config/discord/settings.json"
  "$HOME/snap/discord/current/.config/discord/settings.json"
)

found_any=false

for settings_file in "${settings_files[@]}"; do
  if [ -f "$settings_file" ]; then
    found_any=true
    backup_file="$settings_file.bak"
    cp "$settings_file" "$backup_file"

    python3 - "$settings_file" <<'PY'
import json
import sys

path = sys.argv[1]
key = 'DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING'

try:
    with open(path, 'r', encoding='utf-8') as handle:
        data = json.load(handle)
except Exception:
    data = {}

data[key] = True

with open(path, 'w', encoding='utf-8') as handle:
    # Use standard format without BOM
    json.dump(data, handle, indent=2, separators=(',', ': '))
    handle.write('\n')
PY

    echo "Updated $settings_file"
    echo "Backup saved to $backup_file"
  fi
done

if [ "$found_any" = false ]; then
  echo "Discord settings file not found in any standard locations." >&2
  exit 1
fi

echo "Restart Discord, then press Ctrl + Shift + I to open Developer Tools."