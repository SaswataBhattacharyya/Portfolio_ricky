#!/usr/bin/env python3
"""Validate, inspect and map the GNU/Linux Director's declared skills.

Does not invoke Linux administration scripts or MCP tools.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / ".agents/skills/gnu-linux-director/references/gnu-linux-skill-graph.json"


def get_graph() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def get_skills(graph: dict) -> list[dict]:
    return [dict(name=skill["name"], path=skill["path"], repo=source["repo"])
            for source in graph["sources"] for skill in source["skills"]]


def graph_issues(graph: dict) -> list[str]:
    errors = []
    skills = get_skills(graph)
    names = [s["name"] for s in skills]
    if len(names) != 50 or len(set(names)) != 50:
        errors.append(f"Expected 50 unique skills, got {len(names)} ({len(set(names))} unique)")
    universe = set(names) | {graph["entrypoint"], graph["mcp"]["name"]}
    for route in graph["routes"]:
        for name in [route["lead"], *route["steps"]]:
            if name not in universe:
                errors.append(f"Unknown route skill {route['id']}: {name}")
    for edge in graph["dependencies"]:
        if edge["from"] not in universe or edge["to"] not in universe:
            errors.append(f"Invalid dependency: {edge}")
    return errors


def status(graph: dict) -> tuple[list[str], list[str]]:
    root = Path.home() / ".agents/skills"
    found, missing = [], []
    for skill in get_skills(graph):
        p = root / skill["name"] / "SKILL.md"
        (found if p.is_file() else missing).append(skill["name"])
    return found, missing


def matching_routes(graph: dict, prompt: str) -> list[tuple[int, dict]]:
    text = prompt.casefold()
    found = []
    for route in graph["routes"]:
        count = sum(bool(re.search(
            r"(?<![a-z0-9])" + re.escape(term.casefold()) + r"(?![a-z0-9])", text
        )) for term in route["keywords"])
        if count:
            found.append((count * 10, route))
    return sorted(found, key=lambda x: (-x[0], x[1]["id"]))


def print_route(graph: dict, prompt: str) -> None:
    matched = matching_routes(graph, prompt)
    if not matched:
        print("Recommended lead: linux-sysadmin (read-only initial triage)")
    else:
        print("Recommended lead: " + matched[0][1]["lead"])
        print("Matched topics: " + ", ".join(route["id"] for _, route in matched[:5]))
        steps = list(dict.fromkeys(s for _, r in matched[:3] for s in r["steps"]))
        print("Candidate specialists (load selectively): " + ", ".join(steps))
    print("Advisory only: check target host + real state; do not auto-run destructive actions.")
    print("Observe first -> propose -> approve high-risk changes -> verify.")


def diagram(graph: dict) -> str:
    skills = get_skills(graph)
    ids = {skill["name"]: f"s{i}" for i, skill in enumerate(skills)}
    ids[graph["entrypoint"]] = "director"
    ids[graph["mcp"]["name"]] = "linuxmcp"
    rows = [
        "# Global GNU/Linux Skill Graph", "",
        f"{len(skills)} specialist skills; {len(graph['routes'])} route templates. "
        "The arrows indicate potential handoffs, not unconditional execution.", "",
        "~~~mermaid", "flowchart LR",
        '  director["GLOBAL GNU/LINUX DIRECTOR"]',
        '  linuxmcp["Optional Linux MCP — read-only metrics"]',
        "  director -.-> linuxmcp",
    ]
    for j, source in enumerate(graph["sources"]):
        rows.append(f'  subgraph vendor{j}["{source["repo"]}"]')
        for skill in source["skills"]:
            rows.append(f'    {ids[skill["name"]]}["{skill["name"]}"]')
        rows.append("  end")
    for i, route in enumerate(graph["routes"]):
        rows += [f'  r{i}(["{route["id"]}"])', f"  director --> r{i}",
                 f"  r{i} --> {ids[route['lead']]}"]
        for s in route["steps"]:
            rows.append(f"  r{i} -.-> {ids[s]}")
    for edge in graph["dependencies"]:
        rows.append(f'  {ids[edge["from"]]} -->|{edge["type"]}| {ids[edge["to"]]}')
    rows += ["~~~", "", "Only ONE lead orchestrator per task. Default to read-only inspection.",
             "Require specific authorization for privileged changes and separate confirmation",
             "for destructive ones. An MCP is optional, not a replacement for authorization.", ""]
    return "\n".join(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true")
    group.add_argument("--route", metavar="TEXT")
    group.add_argument("--graph", action="store_true")
    args = parser.parse_args()
    graph = get_graph()
    issues = graph_issues(graph)
    if issues:
        print("\n".join(issues), file=sys.stderr)
        return 2
    if args.route is not None:
        print_route(graph, args.route)
    elif args.graph:
        print(diagram(graph))
    else:
        present, missing = status(graph)
        global_root = Path.home() / ".agents/skills"
        print(f"Valid graph: {len(get_skills(graph))} unique skills, {len(graph['routes'])} routes")
        print(f"Installed GNU/Linux specialist skills: {len(present)}/50")
        print(f"GNU/Linux Director global: {(global_root / 'gnu-linux-director/SKILL.md').is_file()}")
        print(f"Blender Director global: {(global_root / 'blender-director/SKILL.md').is_file()}")
        if missing:
            print("Missing: " + ", ".join(missing))
            print("Install: bash scripts/install-gnu-linux-skill-stack.sh")
            return 1
        print("All specialist skill files present. Optional MCP must be verified separately.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
