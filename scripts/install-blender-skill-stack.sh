#!/usr/bin/env bash
# Run from Webberick repo root: bash scripts/install-blender-skill-stack.sh
# Installs the three Agent Skill repositories into the user's Codex skill directory.
# Does NOT execute upstream scripts or configure Blender MCP.
set -Eeuo pipefail

if [[ ! -f ".agents/skills/webberick-blender-director/SKILL.md" ]]; then
  echo "Run this from the Webberick repository root." >&2
  exit 2
fi
for cmd in git python3; do
  command -v "$cmd" >/dev/null || { echo "Missing prerequisite: $cmd" >&2; exit 2; }
done

target="$HOME/.agents/skills"
mkdir -p "$target"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "Fetching published skill sources (nothing is executed from these repositories)..."
git clone --depth 1 --quiet https://github.com/scenario-labs/skills.git "$tmp/scenario"
git clone --depth 1 --quiet https://github.com/CheshireJCat/create-3d-model-skill.git "$tmp/cheshire"
git clone --depth 1 --quiet https://github.com/RobLe3/cc-blender-skill.git "$tmp/cc"

declare -a dirs=()
for dir in "$tmp/scenario/skills/dcc/blender"/scenario-blender-*/; do
  [[ -d "$dir" ]] && dirs+=("$dir")
done
dirs+=("$tmp/cheshire/skills/create-3d-model")
for dir in "$tmp/cc/plugin/skills"/*/; do
  [[ -d "$dir" ]] && dirs+=("$dir")
done

if [[ "${#dirs[@]}" -ne 44 ]]; then
  echo "Upstream skill count changed: expected 44, found ${#dirs[@]}. Review before installing." >&2
  exit 3
fi

# Atomic validation before writing any skill, no silent replacement.
for dir in "${dirs[@]}"; do
  name="$(basename "$dir")"
  [[ -f "$dir/SKILL.md" ]] || { echo "Missing SKILL.md: $name" >&2; exit 3; }
  if [[ -e "$target/$name" || -L "$target/$name" ]]; then
    echo "Existing skill detected: $name. Refusing to overwrite anything." >&2
    echo "Review or back up old installs, then rerun. Unmodified upstream skills are required." >&2
    exit 3
  fi
done

echo "Installing 44 skill directories into $target"
for dir in "${dirs[@]}"; do
  cp -R "$dir" "$target/$(basename "$dir")"
done

echo "Installed sources:"
for item in scenario cheshire cc; do
  printf '  %s  ' "$item"
  git -C "$tmp/$item" rev-parse HEAD
done
echo "The project-local webberick-blender-director skill is already in this repository."
echo "MCP is not modified. Verify connection with: codex mcp list"
echo "Now validate: python3 scripts/blender_skill_graph.py --check"
echo "Restart Codex so the new skills appear."
