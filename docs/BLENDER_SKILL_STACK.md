# Webberick Blender skill stack

This adds a single project-local Codex entry point to route 44 external Blender Agent Skills across three repositories. The fourth project, MCP for Blender, is the local execution backend and is intentionally **not** installed as another Agent Skill. The setup is opt-in and does not change website runtime dependencies.

## Repository inventory (verified 2026-10-17)

| Repository | Skills | Install location | Role |
| --- | ---: | --- | --- |
| https://github.com/scenario-labs/skills | 13 | ~/.agents/skills/scenario-blender-* | Blender 5.2 expert craft, auditing, procedural modeling |
| https://github.com/CheshireJCat/create-3d-model-skill | 1 (contains 29 nested modules) | ~/.agents/skills/create-3d-model | Codex-native production lead |
| https://github.com/RobLe3/cc-blender-skill | 30 | ~/.agents/skills/* | Source matching, lookdev, repair and export specialists |
| https://github.com/ahujasid/mcp-for-blender | MCP server + Blender add-on | Existing local Blender/Codex setup | Tools to inspect, execute Python and capture results |

The Cheshire package already embeds modules derived from the CC stack; installing CC separately still makes its specialist skills independently discoverable. They should NOT all be executed as independent leaders.

## Installation on your Blender workstation (macOS / Linux / WSL)

Use your local workstation, **not production EC2**. Check that you can run git, bash, Python 3 and Codex. Audit third-party code/skills before running any of their scripts.

From a checkout of the branch containing this change:

~~~bash
# Read the installer first. It clones sources and copies skills; it runs no vendor scripts.
sed -n '1,180p' scripts/install-blender-skill-stack.sh
bash scripts/install-blender-skill-stack.sh
python3 scripts/blender_skill_graph.py --check
~~~

The installer copies all 44 skill folders to ~/.agents/skills. It validates expected folder count and SKILL.md files before copying, and **refuses to overwrite any existing skill**. If a skill is already installed, inspect/backup it manually and decide whether to keep it; the script will not silently replace it.

The setup does not modify ~/.codex/config.toml, run the Blender add-on installer, edit your Blender files, or install Graphify. The install script fetches current upstream default branches, so inspect source changes before updating it in future. Use known commit SHAs for a stricter reproducible setup.

## Reuse the existing MCP (component four)

You said Blender MCP is already installed. First run:

~~~bash
codex mcp list
~~~

In a new Codex task, ask for a **read-only scene inspection**. If a working Blender backend already exists, stop here: adding a second backend is unnecessary and may cause conflicts. Keep the Blender socket on localhost.

If MCP is actually missing, the current ahujasid project documents:

~~~bash
codex mcp add blender -- uvx mcp-for-blender
~~~

Install and enable its Blender add-on separately only if it is missing. Note that the current PyPI package name is mcp-for-blender; blender-mcp remains a compatibility alias. The optional **Codex visual plugin** is different from the MCP server. Its upstream README describes an installable integration at integrations/codex. For the optional inline viewport, inspect that repo's current instructions, for example:

~~~bash
git clone https://github.com/ahujasid/mcp-for-blender.git
codex plugin marketplace add ./mcp-for-blender/integrations/codex
~~~

Then use Codex's plugin interface to install the local marketplace entry if supported by your Codex version. Do **not** set up a second competing Blender control backend without first checking what the plugin configures.

## How to use the director

Restart Codex after installing external skills. From the Webberick repo, prompt:

~~~text
$webberick-blender-director Create a premium futuristic metallic hero object
for my homepage. Pick the right skill chain, inspect the existing scene first,
show me the blockout, and export an optimized GLB with a .blend source.
~~~

Another example that tests vague-feedback interpretation:

~~~text
$webberick-blender-director The thing feels too chunky and generic.
Preserve the parts that work. Diagnose the silhouette and material problems,
improve the largest issue first, and inspect the new render.
~~~

Or source matching:

~~~text
$webberick-blender-director Make this image into a 3D asset.
Match the recognizable silhouette from several views, keep the original
scene intact, and validate the export.
~~~

The director applies the user's latest corrections as constraints, not as disconnected new prompts. If an ambiguity materially affects topology, cost, or destructive edits, it may ask one focused question. For lower-risk uncertainty it should state its assumptions and produce an inspectable blockout.

## Explore the complete graph

The machine-readable skill registry and routing graph lives in:

- .agents/skills/webberick-blender-director/references/skill-graph.json
- The generated diagram: docs/BLENDER_SKILL_GRAPH.md

Use the zero-dependency CLI:

~~~bash
python3 scripts/blender_skill_graph.py --route "make an abstract chrome animation for my homepage"
python3 scripts/blender_skill_graph.py --graph > docs/BLENDER_SKILL_GRAPH.md
python3 scripts/blender_skill_graph.py --check
~~~

The keyword router is a **diagnostic hint**, not the reasoning engine. Codex should incorporate visual evidence, previous feedback and the actual design intent before choosing skills. One LEAD at a time; specialists are staged and gated.

### Optional Graphify integration

Graphify is for mapping the implementation of installed skills and the Webberick project; it is not needed for routing. Its CLI currently uses the PyPI package graphifyy (double y):

~~~bash
uv tool install graphifyy
graphify install --project --platform codex
graphify .
~~~

Graphify generates graphify-out/graph.json, graphify-out/graph.html and GRAPH_REPORT.md. Consult its current README before installing. Its graph has a different purpose from the curated skill-graph.json here: it discovers relationships **from source**, while our catalog declares the intended orchestration policy.

## Asset delivery contract for Webberick

Blender authors the files on the workstation. Normally deliver a versioned source .blend, a portable .glb, and representative review renders, plus BUILD_NOTES.md documenting assumptions, directions and corrections.

Before promoting into the website: verify GLB imports correctly, check geometry/UV/normals and texture compatibility, confirm animations and pivot are correct, and test rendering and download size on a real mobile viewport. Tools such as glTF-Transform, gltfjsx and Khronos glTF Validator are optional helpers, not mandatory Blender skill dependencies.

## Safety and maintenance

- Keep all skill names unique. Do not merge their SKILL.md files or read 44 full skills into the same prompt.
- Never let a specialist instruction delete unrelated Blender data or reset a scene contrary to the director rules.
- MCP Python execution has full local privileges. Review external scripts before execution; do not expose the socket remotely or enable third-party asset providers by default.
- A working Blender MCP connection is required to actually model. This PR delivers the routing and setup infrastructure, not a verified installed Blender workstation or rendered asset.
- For updates, inspect vendor changes and licenses, then intentionally replace selected global skill folders; the installer refuses unsafe overwrite. Re-run --check after updating.
