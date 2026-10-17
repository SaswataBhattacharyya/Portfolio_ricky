#!/usr/bin/env bash
# Install selected GNU/Linux Agent Skills and both global directors for Codex.
# This installs text/reference files only; no vendor install scripts, sudo, or MCP changes.
# Usage: bash scripts/install-gnu-linux-skill-stack.sh [--directors-only]
set -Eeuo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
global="$HOME/.agents/skills"
source_base="${XDG_DATA_HOME:-$HOME/.local/share}/codex-skill-sources"
source_store="$source_base/gnu-linux-packages"
mode="${1:-full}"

if [[ "$mode" != "full" && "$mode" != "--directors-only" ]]; then
  echo "Usage: bash scripts/install-gnu-linux-skill-stack.sh [--directors-only]" >&2
  exit 2
fi
for program in git python3; do
  command -v "$program" >/dev/null || { echo "Missing prerequisite: $program" >&2; exit 2; }
done
for name in blender-director gnu-linux-director; do
  [[ -f "$root/.agents/skills/$name/SKILL.md" ]] || { echo "Missing local director: $name" >&2; exit 2; }
  if [[ -e "$global/$name" || -L "$global/$name" ]]; then
    if ! diff -qr "$root/.agents/skills/$name" "$global/$name" >/dev/null; then
      echo "Global director already exists with different content: $global/$name" >&2
      echo "Review differences and back up it manually. No overwrite will occur." >&2
      exit 3
    fi
  fi
done
mkdir -p "$global"

if [[ "$mode" == "--directors-only" ]]; then
  for name in blender-director gnu-linux-director; do
    if [[ ! -e "$global/$name" && ! -L "$global/$name" ]]; then
      cp -R "$root/.agents/skills/$name" "$global/$name"
    fi
  done
  echo "Installed global directors at $global/{blender-director,gnu-linux-director}"
  echo "This mode does NOT install the 50 GNU/Linux specialist skills."
  exit 0
fi

# Validate the declared inventory before any third-party file is installed.
python3 "$root/scripts/gnu_linux_skill_graph.py" --graph >/dev/null
if [[ -e "$source_store" ]]; then
  echo "Found $source_store" >&2
  echo "Refusing to replace a previous vendor checkout. Review/update explicitly." >&2
  echo "If installed already, run python3 scripts/gnu_linux_skill_graph.py --check." >&2
  exit 3
fi

mkdir -p "$source_base"
stage="$(mktemp -d "$source_base/.gnu-linux-staging.XXXXXXXX")"
trap '[[ ! -d "$stage" ]] || rm -rf -- "$stage"' EXIT

echo "Fetching reviewed skill families into a temporary staging directory..."
git clone --quiet --depth 1 https://github.com/peterbamuhigire/linux-skills.git "$stage/linux-skills"
git clone --quiet --depth 1 https://github.com/HermeticOrmus/linux-sysadmin-skills.git "$stage/linux-sysadmin-skills"
git clone --quiet --depth 1 https://github.com/wshobson/agents.git "$stage/agents"

# Preflight all 50 specialist links BEFORE making any change to the skill root.
count=0
while IFS=$'\t' read -r source name relative; do
  [[ -n "$source" ]] || continue
  candidate="$stage/$source/$relative"
  [[ -f "$candidate/SKILL.md" ]] || { echo "Missing upstream SKILL.md: $candidate" >&2; exit 3; }
  if [[ -e "$global/$name" || -L "$global/$name" ]]; then
    echo "Existing global skill: $global/$name. Refusing to overwrite it." >&2
    exit 3
  fi
  count=$((count + 1))
done < <(python3 - "$root" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
manifest = json.loads((root / '.agents/skills/gnu-linux-director/references/gnu-linux-skill-graph.json').read_text())
for source in manifest['sources']:
    repo_folder = source['repo'].rsplit('/', 1)[-1]
    for skill in source['skills']:
        print(f"{repo_folder}\t{skill['name']}\t{skill['path']}")
PY
)
if [[ "$count" -ne 50 ]]; then
  echo "Expected 50 validated specialist skills, got $count." >&2
  exit 3
fi

echo "Source revisions:"
for dir in linux-skills linux-sysadmin-skills agents; do
  printf '  %-22s ' "$dir"
  git -C "$stage/$dir" rev-parse HEAD
done
echo "Storing vendor repositories with shared references intact: $source_store"
mv "$stage" "$source_store"

while IFS=$'\t' read -r source name relative; do
  [[ -n "$source" ]] || continue
  ln -s "$source_store/$source/$relative" "$global/$name"
done < <(python3 - "$root" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
manifest = json.loads((root / '.agents/skills/gnu-linux-director/references/gnu-linux-skill-graph.json').read_text())
for source in manifest['sources']:
    repo_folder = source['repo'].rsplit('/', 1)[-1]
    for skill in source['skills']:
        print(f"{repo_folder}\t{skill['name']}\t{skill['path']}")
PY
)

for name in blender-director gnu-linux-director; do
  if [[ ! -e "$global/$name" && ! -L "$global/$name" ]]; then
    cp -R "$root/.agents/skills/$name" "$global/$name"
  fi
done
echo "Installed 50 global GNU/Linux skills + both global directors."
echo "No root/apt/service changes and no MCP changes were made."
python3 "$root/scripts/gnu_linux_skill_graph.py" --check
echo "Restart Codex to discover newly installed skills."
