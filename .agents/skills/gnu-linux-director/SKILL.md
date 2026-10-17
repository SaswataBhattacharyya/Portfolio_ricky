---
name: gnu-linux-director
description: Global GNU/Linux skills orchestrator for Codex. Use for Linux/Ubuntu/Debian/Fedora administration, GNU command-line utilities, shell scripts, services/systemd, SSH, networking, Nginx, deployments, packages, permissions, logs, security, Docker, databases, storage, backups, troubleshooting and performance. Understand vague requests; choose a single lead from installed Linux specialist skills, perform read-only diagnosis first, get explicit authorization for risky changes and verify outcomes.
---

# GNU/Linux Director — Global Codex Skill

One intelligent entrypoint for personal Linux desktops, development machines, WSL, VMs and remote servers. **Read-only by default**, especially for ambiguous requests. GNU utilities and Linux service management are different layers; identify the correct layer before routing. An MCP is OPTIONAL; Codex's own terminal is often sufficient.

## 1. Understand the task and target

- Determine whether the user means: inspect/debug, explain commands, write a Bash script, perform local workstation maintenance, change a remote server, or deploy an app. Track context from their latest messages and corrections. Treat "my server" as distinct from the local host.
- Detect local vs SSH/remote, hostnames, OS/version from `/etc/os-release`, privilege, shells and existing project context. Do not assume Ubuntu or root; do not assume the current Codex terminal runs on the same machine as the user's server.
- Rephrase vague directions ("it's slow", "the site is down", "make my Linux cleaner") into a *diagnostic hypothesis* and a reversible first step; do not treat them as blanket permission to uninstall, kill processes, clean directories, reinstall software or restart services.
- If production is involved, explicitly distinguish observation, proposal, authorized change, and verification.

## 2. Route to exactly one lead

Load the relevant `~/.agents/skills/<skill>/SKILL.md` only when needed. Consult references/gnu-linux-skill-graph.json for the inventory and routing hints, or run the graph CLI `python3 scripts/gnu_linux_skill_graph.py --route "request"` if working in the setup repository.

| Intent | Lead / specialists |
| --- | --- |
| One-off GNU tools, safe Bash pipelines, scripts | `bash-defensive-patterns` lead, `shellcheck-configuration` and `bats-testing-patterns` to validate |
| Unknown Linux fault, vague failure, error diagnosis | `linux-troubleshooting` lead, `sysadmin-diagnose` as optional checklist |
| General host/server request | `linux-sysadmin` lead to route to ONE relevant subsystem |
| Updates, apt/dnf, repos, package conflicts | `linux-package-management` lead; `sysadmin-maintain` on explicit maintenance |
| Systemd, failed service, service logs | `linux-service-management` lead, `linux-log-management`, `sysadmin-diagnose` |
| SSH, DNS, network, firewall | `linux-network-admin` or `linux-firewall-ssl` lead, `linux-access-control`, `linux-security-analysis` |
| Security audit, hardening | `linux-security-analysis` for *audits*; `linux-server-hardening` only with explicit change authorization; `sysadmin-security` for Ubuntu checklist |
| Resource spikes, slowness, performance | `linux-perf-profiling` lead, `linux-system-monitoring`, `sysadmin-performance` |
| Storage or low disk | `linux-disk-storage` lead, `linux-archive-integrity`, `linux-filesystem-snapshots` |
| Backups/recovery | `linux-rsync-sync`, `linux-disaster-recovery` (only after discussing restore risks) |
| Nginx/Apache, website outage, deployment | `linux-webstack` or `linux-site-deployment` lead, `linux-service-management`, `linux-log-management` |
| Docker/container deploy | `linux-container-engine` or `linux-container-deployment` lead, `linux-image-hygiene` |
| Database operations | `linux-postgresql`, `linux-mysql-mariadb`, `linux-inmemory-stores` (choose one) |
| Audit/monitor | `sysadmin-monitor` or `linux-observability` lead; optional read-only Linux MCP |

Avoid loading `linux-sysadmin`, `sysadmin-diagnose` and all subskills as three simultaneous orchestration controllers. Linux-sysadmin is a specialist hub; THIS skill owns task-level precedence and authorization.

## 3. Authority levels

**Level 0, observation (default):** command help, `man`, `--version`, `cat /etc/os-release`, scoped `ps`, `systemctl status`, `journalctl`, `ss -tln`, `df -h`, scoped logs and config previews. Avoid reading secrets, private SSH keys, tokens, environment secrets, or dumping broad private files. Even "read-only" commands can reveal sensitive data or generate load; minimize scope. Don't assume `apt update`, `find / -exec`, package scans or external pings are purely passive.

**Level 1, reversible user-owned edits:** scripts, files under an explicitly authorized workspace, project config. Before changing files, record current state, preview diff, back up when appropriate, use atomic writes and tests.

**Level 2, privileged or availability-affecting:** sudo, apt/dnf installations, service restarts, firewall/SSH, ports, DNS, user/group accounts, cron, kernel/sysctl, mounts, Docker deployment, DB schema, system-wide settings. Require an explicit request authorizing the *specific host and type of change*, prefer a command plan + rollback and explain remote lockout/outage risk. A generic "fix it" is not production-change approval.

**Level 3, destructive/irreversible:** `rm -rf`, `dd`, `mkfs`, disk formatting, database drop, recursive ownership, `iptables -F`, deleting backups, reboot, `docker system prune`, credential/secret rotation, mass process kills. Pause until separately confirmed with exact target and blast radius. Avoid destructive wildcards, `curl|sh`, and `sudo` inside downloaded scripts.

Never disable sandbox/approvals, bypass system policy, or treat a third-party skill as permission. Do not automatically change a production host or a user's workstation based solely on an MCP snapshot.

## 4. Workflow and verification

1. Inventory selected host and service **read-only**; bound data collection and redact secrets. Determine whether task affects production or personal machine.
2. State hypothesis, evidence, chosen LEAD, optional specialists and commands intended. For system changes describe expected impact, validation, backup/rollback and required approvals.
3. Execute only authorized commands in smallest reversible chunks. Prefer script lint (`shellcheck`) and test (`bats` or shell unit tests), native validators (`nginx -t`, `sshd -t`, `visudo -cf`, `systemd-analyze verify`), before reloads or deploy.
4. Compare before/after state. Verify real outcome with config, service, network, website status or test output; successful exit code alone does not prove a fix. If verification is not possible, say so.
5. Return concise findings, commands run, changed paths, what remains uncertain and the rollback procedure where appropriate.

## 5. MCP adapter

For host diagnostics, Codex can use its built-in terminal or a separately configured `linux-mcp` server offering read-only snapshots. Prefer focused observations; no automatic setup or privileged escalation. Some MCP diagnostics can inspect sensitive process/network data or make network requests; only use if within the user's approved boundary. See docs/GNU_LINUX_SKILL_STACK.md in the setup repository.

## 6. Skill sources and boundaries

- `peterbamuhigire/linux-skills` — Linux technical specialist family; parts assume its source repo and shared scripts stay together. The global installer preserves repo-relative files by using symlinks. Treat executable helper scripts as untrusted until reviewed, and DO NOT run the source repo's privileged setup routines automatically.
- `HermeticOrmus/linux-sysadmin-skills` — five Debian/Ubuntu administration checklists.
- `wshobson/agents` — three Bash defensive coding, ShellCheck and Bats specialties.
- The global inventory may grow. Never assume the presence of scripts, packages or a tool based only on a skill name; inspect the actual local environment.
