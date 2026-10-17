# Global Blender + GNU/Linux Directors for Codex

This repository includes two reusable skills:

- `blender-director`: global Blender router across the 44 previously installed Blender skills.
- `gnu-linux-director`: global GNU/Linux router across **50 specialist skills** (42 Peter Bamuhigire Linux skills, 5 HermeticOrmus Ubuntu checklists, 3 wshobson Bash/ShellCheck/Bats skills).

The **project-specific** `webberick-blender-director` remains in this repository. Codex should prefer it while working on Webberick; use global `blender-director` everywhere else.

## Where global skills live

Codex user-level skill root: `$HOME/.agents/skills/`.

The 44 Blender skills from the earlier installer are already there. Those do not need to be reinstalled.

The two *directors* are project files until you copy them to the user-level root. The optional Linux diagnostic MCP is separate, installed in Codex MCP config, and is not an Agent Skill.

## Install on your own Linux workstation

Run from the checked-out repository branch:

~~~bash
# 1. Preview what the installer will do; no sudo is required
sed -n '1,220p' scripts/install-gnu-linux-skill-stack.sh

# 2. Globalize just the two directors first, if desired
bash scripts/install-gnu-linux-skill-stack.sh --directors-only

# 3. Install 50 additional third-party GNU/Linux specialist skills
bash scripts/install-gnu-linux-skill-stack.sh

# 4. Verify
python3 scripts/gnu_linux_skill_graph.py --check
python3 scripts/blender_skill_graph.py --check
codex mcp list
~~~

Step 3 works even after Step 2: identical copies of directors are left untouched. Running Step 3 again refuses to replace the persistent vendor source checkout. This is intentional to prevent silent upstream upgrades.

**The installer does not execute vendor scripts, install packages with apt, use sudo, change firewall/systemd, or configure MCP.** It clones sources to a staging directory first and checks every skill before linking them. Installed skills are symlinks to full repository checkouts inside `~/.local/share/codex-skill-sources/gnu-linux-packages/` (or under XDG_DATA_HOME if configured), preserving shared reference files. Do not delete that source directory while using the skills; when opening a skill via symlink, resolve its real path to follow references correctly. Audit third-party skills and scripts before asking Codex to run any helper.

Restart Codex after installation. Skills are **global for your Linux user account**, not automatically shared across other Unix users or hosts. Nothing is installed on EC2.

## Usage examples

~~~text
$blender-director Build a premium mechanical object, show me a silhouette
review, use the best modeling skills, and export a verified GLB.
~~~

~~~text
$gnu-linux-director My laptop is suddenly slow. Identify the likely
cause using read-only checks. Show me the evidence before proposing any fix.
~~~

~~~text
$gnu-linux-director My Ubuntu EC2 Nginx site is showing 502 errors.
Choose the appropriate troubleshooting skills. Give me safe diagnostic
commands first; do not change firewall, packages or services yet.
~~~

~~~text
$gnu-linux-director Write a robust Bash backup script using GNU tools.
Run ShellCheck and Bats tests if the tools are installed.
~~~

The director chooses one lead specialist, loads optional domain skills only when needed and starts read-only. Vague instructions such as "fix my server" do not authorize a production change.

## Graph and routing CLI

Inventory: `.agents/skills/gnu-linux-director/references/gnu-linux-skill-graph.json`

Diagram: `docs/GNU_LINUX_SKILL_GRAPH.md`

~~~bash
python3 scripts/gnu_linux_skill_graph.py --route "why is my nginx server slow"
python3 scripts/gnu_linux_skill_graph.py --graph > docs/GNU_LINUX_SKILL_GRAPH.md
python3 scripts/gnu_linux_skill_graph.py --check
~~~

Routing by keywords is a *debugging aid*. Codex's decision should use actual symptoms, filesystem and host context, previous instructions, security boundary, operating system and user intent. The graph can optionally be examined with Graphify; installing Graphify is not required.

## An optional Linux MCP

**Suggested repository:** [Mohabdo21/linux-mcp](https://github.com/Mohabdo21/linux-mcp).

It offers a local, stdio-based Linux diagnostics MCP with system and process data, CPU, memory, disk, services, network, Docker and other diagnostic resources. This is distinct from Blender MCP. It is advertised as read-only, but some tools can read sensitive local data or contact outside network services; treat its access carefully, run as an unprivileged user, and review its code and tool list first.

It is **optional**: Codex's existing shell can already use `df`, `ps`, `systemctl`, `journalctl`, `ss`, and `/proc`. One extra MCP is useful when you want structured diagnostic snapshots. The project is third-party and comparatively new; it is not audited or endorsed here. Avoid adding it on production EC2 by default.

Upstream offers source builds (currently Go 1.27+), GitHub Releases binaries and MCP Registry entry `io.github.Mohabdo21/linux-mcp`. Review the [release page](https://github.com/Mohabdo21/linux-mcp/releases), select the binary for your architecture, and verify integrity/provenance before placing it in a trusted, user-owned executable path. Example *after* you've reviewed the downloaded binary:

~~~bash
# Set this to the reviewed, absolute executable path on your machine
LINUX_MCP_BIN="$HOME/.local/bin/linux-mcp"
test -x "$LINUX_MCP_BIN" || echo "Install the verified binary first"

# Only if the path is an executable you trust:
codex mcp add linux-mcp -- "$LINUX_MCP_BIN"
codex mcp list
~~~

If an MCP named `linux-mcp` is already configured, do not create a duplicate. Restart Codex after configuring. Keep diagnostic access local to your workstation and do not launch it as root.

## Security tiers and limits

- **Observe**: scoped, read-only diagnostics (still avoid secrets and unnecessary broad scans).
- **Reversible edits**: user-owned files/scripts, backups, dry-run and diff.
- **Privilege / uptime impact**: explicit host-specific authorization for sudo, package changes, service restarts, SSH/network/firewall, mounts, deploy and database changes.
- **Destructive**: separate confirmation for deletions, disk formatting, database drops, broad cleanup, reboot and irreversible changes.

For SSH/firewall changes on remote machines always prepare a backout path. For Nginx, SSH, sudoers and systemd configuration changes use native validators before activation. Do not execute unreviewed vendor shell scripts, install external apt repositories automatically or silently expand an MCP's authority.

## Troubleshooting

`--check` reports 50/50 only if the expected skill entrypoints exist and are readable. It does not confirm a connection to a remote Linux server, the runtime behavior of vendor scripts, Go toolchain availability or MCP permissions. Verify those separately for each task.

If `$blender-director` doesn't show up, ensure `~/.agents/skills/blender-director/SKILL.md` exists and start a NEW Codex session. Likewise for `$gnu-linux-director`.
