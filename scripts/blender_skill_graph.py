#!/usr/bin/env python3
"""Inspect the Webberick Blender skill inventory, plan a route, or render a Mermaid graph.

No Blender/Python/MCP commands from third-party sources are executed by this tool.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / ".agents/skills/webberick-blender-director/references/skill-graph.json"


def load_graph() -> dict:
    return json.loads(CATALOG.read_text(encoding="utf-8"))


def skill_names(graph: dict) -> list[str]:
    return [n for src in graph["sources"] for n in src["skills"]]


def validate(graph: dict) -> list[str]:
    errors = []
    names = skill_names(graph)
    if len(names) != 44:
        errors.append(f"expected 44 specialist skills, got {len(names)}")
    if len(set(names)) != len(names):
        errors.append("duplicate specialist skill names")
    known = set(names) | {graph["entrypoint"], graph["mcp"]["name"]}
    for route in graph["routes"]:
        if route["lead"] not in known:
            errors.append(f"unknown lead in route {route['id']}: {route['lead']}")
        for skill in route["steps"]:
            if skill not in known:
                errors.append(f"unknown routed skill {skill} in {route['id']}")
    for edge in graph["dependencies"]:
        if edge["from"] not in known or edge["to"] not in known:
            errors.append(f"unknown dependency edge {edge}")
    return errors


def present_skills(graph: dict) -> tuple[list[str], list[str]]:
    global_skills = Path.home() / ".agents/skills"
    local_skills = ROOT / ".agents/skills"
    found, missing = [], []
    for name in skill_names(graph):
        dirs = (local_skills / name, global_skills / name)
        (found if any((d / "SKILL.md").is_file() for d in dirs) else missing).append(name)
    return found, missing


def detect_routes(graph: dict, prompt: str) -> list[tuple[int, dict]]:
    prompt = prompt.casefold()
    scored = []
    for route in graph["routes"]:
        matching = [
            keyword for keyword in route["keywords"]
            if re.search(r"(?<![a-z0-9])" + re.escape(keyword.casefold()) + r"(?![a-z0-9])", prompt)
        ]
        if matching:
            scored.append((len(matching) * 10 + route.get("priority", 0), route))
    scored.sort(key=lambda x: (-x[0], x[1]["id"]))
    return scored


def print_route(graph: dict, prompt: str) -> None:
    matches = detect_routes(graph, prompt)
    if not matches:
        print("Lead: create-3d-model (general reversible blockout; no strong keyword match)")
        print("Also load: scenario-blender-expert when a technical specialist is needed")
        print("Before edits: inspect scene, interpret user intent, preserve existing work")
        return
    lead = matches[0][1]["lead"]
    print(f"Recommended lead: {lead}")
    print("Matched intent: " + ", ".join(r["id"] for _, r in matches[:4]))
    seen = set()
    steps = []
    for _, route in matches[:4]:
        for step in route["steps"]:
            if step != lead and step not in seen:
                seen.add(step)
                steps.append(step)
    print("Candidate specialists (choose only those truly needed):")
    for name in steps:
        print("  - " + name)
    print("Routing is advisory: the director decides using user context and scene evidence.")
    print("Mandatory: inspect → blockout → visual review → refine → export/verify.")


def mermaid(graph: dict) -> str:
    names = skill_names(graph)
    ids = {name: f"s{i}" for i, name in enumerate(names)}
    ids[graph["entrypoint"]] = "director"
    ids[graph["mcp"]["name"]] = "mcp"
    lines = [
        "# Webberick Blender Skill Graph",
        "",
        "Generated from .agents/skills/webberick-blender-director/references/skill-graph.json.",
        "All 44 installable skills are shown. Arrows indicate candidate routing and explicit",
        "cross-skill dependencies; they do not mean every skill loads for every request.",
        "",
        "~~~mermaid",
        "flowchart LR",
        '  director["WEBBERICK BLENDER DIRECTOR"]',
        '  mcp["ahujasid MCP for Blender (backend)"]',
        "  director --> mcp",
    ]
    for j, src in enumerate(graph["sources"]):
        lines.append(f'  subgraph source{j}["{src["repo"]}"]')
        for n in src["skills"]:
            lines.append(f'    {ids[n]}["{n}"]')
        lines.append("  end")
    for i, route in enumerate(graph["routes"]):
        lines.append(f'  r{i}(["{route["id"]}"])')
        lines.append(f"  director --> r{i}")
        lines.append(f"  r{i} --> {ids[route['lead']]}")
        for step in route["steps"]:
            lines.append(f"  r{i} -.-> {ids[step]}")
    for dep in graph["dependencies"]:
        lines.append(f'  {ids[dep["from"]]} -->|{dep["type"]}| {ids[dep["to"]]}')
    lines += ["~~~", "", "## Routing policy", "",
              "Only one lead orchestrator per task. Cross-family skills are specialists;",
              "the existing local MCP is the sole execution backend. Validate via renders.",
              "Graphify can analyze the actual installed source graph but does not replace",
              "this explicit intent / safety routing contract.", ""]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--route", metavar="PROMPT", help="Recommend a workflow for a user prompt")
    g.add_argument("--check", action="store_true", help="Validate graph and installed skills")
    g.add_argument("--graph", action="store_true", help="Print all-node Mermaid markdown")
    args = ap.parse_args()
    graph = load_graph()
    issues = validate(graph)
    if issues:
        print("\n".join("ERROR: " + s for s in issues), file=sys.stderr)
        return 2
    if args.route is not None:
        print_route(graph, args.route)
    elif args.graph:
        print(mermaid(graph))
    else:
        found, missing = present_skills(graph)
        print(f"Graph valid: {len(skill_names(graph))} unique skills, {len(graph['routes'])} routes")
        print(f"Installed skills with SKILL.md: {len(found)}/44")
        if missing:
            print("Missing: " + ", ".join(missing))
            print("Install with: bash scripts/install-blender-skill-stack.sh")
            return 1
        print("Inventory present. MCP connection must be verified separately in Codex.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
