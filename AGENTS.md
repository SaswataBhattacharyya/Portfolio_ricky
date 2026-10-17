# Webberick Codex project guidance

This repository powers the Webberick portfolio. Follow the existing implementation and deployment guidance for normal web tasks.

## Blender / 3D requests

For any request to create, edit, animate, render, inspect, export, or improve a 3D asset, use the project skill at .agents/skills/webberick-blender-director/SKILL.md. It is the single top-level Blender coordinator; do not independently activate multiple third-party orchestrators.

Interpret short or vague requests using the user's latest direction, available references, the current Blender scene, and the website context. State material assumptions; ask only about decisions that would be expensive or impossible to reverse.

Blender is an authoring tool, not a dependency of the production website or EC2 instance. Do not run Blender, install Blender MCP, or run the optional skill installer on the production server. Use Blender on the user's authorized workstation with its existing local MCP connection.

Never clear a Blender scene or overwrite original .blend assets without explicit permission. Check screenshots/renders, mesh health, export correctness, and browser performance before declaring 3D work complete.

Setup and routing documentation: docs/BLENDER_SKILL_STACK.md.
