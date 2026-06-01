#!/usr/bin/env bash
set -euo pipefail

settings_file="$HOME/.config/discord/settings.json"
backup_file="$settings_file.bak"

if [ ! -f "$settings_file" ]; then
  echo "Discord settings file not found at: $settings_file" >&2
  exit 1
fi

cp "$settings_file" "$backup_file"

python3 - "$settings_file" <<'PY'
import json
import sys

path = sys.argv[1]
key = 'DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING'

with open(path, 'r', encoding='utf-8') as handle:
    data = json.load(handle)

data[key] = True

with open(path, 'w', encoding='utf-8') as handle:
    json.dump(data, handle, indent=2)
    handle.write('\n')
PY

echo "Updated $settings_file"
echo "Backup saved to $backup_file"
echo "Restart Discord, then press Ctrl + Shift + I to open Developer Tools."