# Global GNU/Linux Skill Graph

50 specialist skills; 16 route templates. The arrows indicate potential handoffs, not unconditional execution.

~~~mermaid
flowchart LR
  director["GLOBAL GNU/LINUX DIRECTOR"]
  linuxmcp["Optional Linux MCP — read-only metrics"]
  director -.-> linuxmcp
  subgraph vendor0["peterbamuhigire/linux-skills"]
    s0["linux-cloud-init"]
    s1["linux-config-management"]
    s2["linux-package-management"]
    s3["linux-server-provisioning"]
    s4["linux-access-control"]
    s5["linux-secrets"]
    s6["linux-dns-server"]
    s7["linux-network-admin"]
    s8["linux-mail-server"]
    s9["linux-site-deployment"]
    s10["linux-webstack"]
    s11["linux-service-management"]
    s12["linux-virtualization"]
    s13["linux-disk-storage"]
    s14["linux-firewall-ssl"]
    s15["linux-intrusion-detection"]
    s16["linux-ngo-cyber-resilience"]
    s17["linux-security-analysis"]
    s18["linux-server-hardening"]
    s19["linux-log-management"]
    s20["linux-observability"]
    s21["linux-system-monitoring"]
    s22["linux-disaster-recovery"]
    s23["linux-troubleshooting"]
    s24["linux-bash-scripting"]
    s25["linux-repo-sync"]
    s26["linux-inmemory-stores"]
    s27["linux-mysql-mariadb"]
    s28["linux-postgresql"]
    s29["linux-container-deployment"]
    s30["linux-container-engine"]
    s31["linux-image-hygiene"]
    s32["linux-archive-integrity"]
    s33["linux-filesystem-snapshots"]
    s34["linux-rsync-sync"]
    s35["linux-kernel-modules"]
    s36["linux-perf-profiling"]
    s37["linux-sysctl-tuning"]
    s38["linux-auditd-rules"]
    s39["linux-benchmark-scanning"]
    s40["linux-file-integrity"]
    s41["linux-sysadmin"]
  end
  subgraph vendor1["HermeticOrmus/linux-sysadmin-skills"]
    s42["sysadmin-diagnose"]
    s43["sysadmin-maintain"]
    s44["sysadmin-monitor"]
    s45["sysadmin-performance"]
    s46["sysadmin-security"]
  end
  subgraph vendor2["wshobson/agents"]
    s47["bash-defensive-patterns"]
    s48["bats-testing-patterns"]
    s49["shellcheck-configuration"]
  end
  r0(["bash-gnu-tools"])
  director --> r0
  r0 --> s47
  r0 -.-> s24
  r0 -.-> s49
  r0 -.-> s48
  r1(["unknown-incident"])
  director --> r1
  r1 --> s23
  r1 -.-> s42
  r1 -.-> s21
  r1 -.-> s19
  r2(["host-admin"])
  director --> r2
  r2 --> s41
  r2 -.-> s21
  r2 -.-> s44
  r3(["packages"])
  director --> r3
  r3 --> s2
  r3 -.-> s43
  r4(["services"])
  director --> r4
  r4 --> s11
  r4 -.-> s19
  r4 -.-> s42
  r5(["network"])
  director --> r5
  r5 --> s7
  r5 -.-> s14
  r5 -.-> s4
  r6(["web-ops"])
  director --> r6
  r6 --> s10
  r6 -.-> s9
  r6 -.-> s11
  r6 -.-> s19
  r7(["security-audit"])
  director --> r7
  r7 --> s17
  r7 -.-> s46
  r7 -.-> s18
  r8(["performance"])
  director --> r8
  r8 --> s36
  r8 -.-> s21
  r8 -.-> s45
  r8 -.-> s37
  r9(["disk-storage"])
  director --> r9
  r9 --> s13
  r9 -.-> s33
  r9 -.-> s32
  r10(["backups"])
  director --> r10
  r10 --> s34
  r10 -.-> s32
  r10 -.-> s22
  r11(["containers"])
  director --> r11
  r11 --> s30
  r11 -.-> s29
  r11 -.-> s31
  r12(["database"])
  director --> r12
  r12 --> s28
  r12 -.-> s27
  r12 -.-> s26
  r13(["monitoring"])
  director --> r13
  r13 --> s20
  r13 -.-> s19
  r13 -.-> s44
  r13 -.-> s21
  r14(["maintenance"])
  director --> r14
  r14 --> s43
  r14 -.-> s2
  r14 -.-> s21
  r15(["cloud-infra"])
  director --> r15
  r15 --> s3
  r15 -.-> s0
  r15 -.-> s1
  director -->|general-hub| s41
  director -->|diagnostic-lead| s23
  director -->|GNU-cli-lead| s47
  director -->|optional-readonly-system-data| linuxmcp
  s23 -->|log-evidence| s19
  s23 -->|resource-evidence| s21
  s10 -->|service-diagnostics| s11
  s10 -->|incident-evidence| s19
  s9 -->|network-gate| s14
  s17 -->|only-after-approval| s18
  s24 -->|static-validation| s49
  s47 -->|test-validation| s48
  s13 -->|backup-before-change| s33
  s34 -->|backup-integrity| s32
  s36 -->|explicit-approval| s37
  s30 -->|image-audit| s31
  s2 -->|approved-maintenance| s43
~~~

Only ONE lead orchestrator per task. Default to read-only inspection.
Require specific authorization for privileged changes and separate confirmation
for destructive ones. An MCP is optional, not a replacement for authorization.
