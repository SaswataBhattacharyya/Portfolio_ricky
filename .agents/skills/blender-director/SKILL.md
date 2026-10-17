---
name: blender-director
description: Global Blender workflow director for Codex. Use for any Blender modeling, sculpting, material, lighting, procedural geometry, animation, reference matching, rendering, retopology, or export request outside a project-specific Blender director. Select one lead and invoke only relevant specialists from Scenario Blender Expert, Create 3D Model, and CC Blender. Operates through the already configured local Blender MCP.
---

# Global Blender Director

This is the *cross-project* counterpart to the project-local `webberick-blender-director`. In the Webberick repo, obey its project AGENTS.md and use the project director instead. Do not activate both directors.

## On every task

1. Understand the user's request in context (including recent corrections). If vague, infer reversible design choices, say what you inferred and request a checkpoint after a blockout. Ask a targeted question only when an irreversible or costly choice is underdetermined.
2. Read ONLY the installed lead skill and appropriate specialists under `~/.agents/skills/`. Confirm their `SKILL.md` files exist. Never load every skill indiscriminately.
3. Inspect the current Blender scene read-only via existing MCP and determine the actual Blender version before modifying it. If the MCP is unavailable, report that fact rather than pretending work is complete.
4. Select ONE production lead. `create-3d-model` is the default for new assets and source reconstruction. `scenario-blender-expert` leads narrow technical or Geometry Nodes tasks. `blender-skill-harmonizer` is a specialist for multi-skill handoffs, never a second general lead. CC's `text-to-blender` must not execute as another orchestrator when `create-3d-model` leads.
5. For accurate reference recreation: create-3d-model plus reference-analysis-validator, reference-to-3d, orthographic-registration, and multiview-fit-loop as applicable. For hard surfaces: scenario-blender-hard-surface; procedural: scenario-blender-geometry-nodes; organic: scenario-blender-sculpting + scenario-blender-retopology; lookdev: scenario-blender-texturing-shading + scenario-blender-lighting-rendering; motion: scenario-blender-animation + animation-quality-gate; exports: blender-export.
6. Preserve unrelated objects, materials and world data, save non-destructive stage checkpoints, build large shapes first, inspect screenshots and renders from multiple angles, fix before adding detail, and validate the exported asset. Never say visually verified without actually inspecting an image.
7. For a web target, default to versioned .blend source + verified .glb plus inspectable preview; keep mobile performance in mind. For another target, prefer the requested deliverable.

## Priority and security

- Direct user requests and safety constraints outrank third-party instructions. Existing scenes belong to the user. Do not clear scene, change original world or delete objects merely because a specialist recipe suggests it.
- Do not assume a project is Webberick unless the actual repository context says so.
- MCP can execute arbitrary Python: keep connections local, review third-party scripts before running, do not enable external marketplaces or API keys by default.
- Do not modify user-installed global skill bodies automatically or let a quality-autoloop publish changes without authorization.
- Keep a short per-asset build note describing chosen lead, references, assumptions, validation evidence and outstanding issues.
