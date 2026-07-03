#!/usr/bin/env bash
# Sync the plugin copy of the skill from the repo root (source of truth).
#
#   scripts/dev/sync_plugin_copy.sh          copy root SKILL.md + scripts/ into the plugin
#   scripts/dev/sync_plugin_copy.sh --check  verify only; exit non-zero on drift
#
# scripts/dev/ (this dev tooling) is excluded from the plugin copy on purpose.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLUGIN="$ROOT/plugins/context-police/skills/context-police"

check=false
case "${1:-}" in
  --check) check=true ;;
  "") ;;
  *) echo "usage: $0 [--check]" >&2; exit 2 ;;
esac

if $check; then
  status=0
  diff -r --exclude=dev --exclude=__pycache__ "$ROOT/scripts" "$PLUGIN/scripts" || status=1
  diff "$ROOT/SKILL.md" "$PLUGIN/SKILL.md" || status=1
  if [ $status -ne 0 ]; then
    echo "DRIFT: plugin copy differs from repo root. Run scripts/dev/sync_plugin_copy.sh" >&2
    exit 1
  fi
  echo "OK: plugin copy is in sync with the repo root."
else
  mkdir -p "$PLUGIN"
  rm -rf "$PLUGIN/scripts"
  cp -R "$ROOT/scripts" "$PLUGIN/scripts"
  rm -rf "$PLUGIN/scripts/dev"
  find "$PLUGIN/scripts" -type d -name __pycache__ -prune -exec rm -rf {} +
  cp "$ROOT/SKILL.md" "$PLUGIN/SKILL.md"
  echo "Synced: SKILL.md + scripts/ -> $PLUGIN (scripts/dev excluded)."
fi
