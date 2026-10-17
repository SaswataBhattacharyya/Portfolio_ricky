# Webberick Blender Skill Graph

This diagram includes all **44 installable specialist skills** (13 Scenario + 1 Cheshire entrypoint + 30 CC), plus the Webberick director, MCP backend and nine intent routes. It is generated from the declared routing catalog, not an automatic discovery of every upstream relative link.

~~~mermaid
flowchart LR
  director["WEBBERICK BLENDER DIRECTOR"]
  mcp["ahujasid MCP for Blender (backend)"]
  director --> mcp
  subgraph source0["scenario-labs/skills"]
    s0["scenario-blender-expert"]
    s1["scenario-blender-animation"]
    s2["scenario-blender-geometry-nodes"]
    s3["scenario-blender-grease-pencil"]
    s4["scenario-blender-hair"]
    s5["scenario-blender-hard-surface"]
    s6["scenario-blender-lighting-rendering"]
    s7["scenario-blender-previs-storyboard"]
    s8["scenario-blender-retopology"]
    s9["scenario-blender-rigging"]
    s10["scenario-blender-sculpting"]
    s11["scenario-blender-texturing-shading"]
    s12["scenario-blender-uv-baking"]
  end
  subgraph source1["CheshireJCat/create-3d-model-skill"]
    s13["create-3d-model"]
  end
  subgraph source2["RobLe3/cc-blender-skill"]
    s14["animation-quality-gate"]
    s15["atlas-uv-fitting"]
    s16["blender-animation"]
    s17["blender-cameras"]
    s18["blender-export"]
    s19["blender-lighting"]
    s20["blender-materials"]
    s21["blender-modeling"]
    s22["blender-pro-workflow"]
    s23["blender-rendering"]
    s24["blender-skill-harmonizer"]
    s25["blender-uv-texturing"]
    s26["closed-surface-uv-coverage"]
    s27["contour-to-mesh"]
    s28["fit-repair-optimizer"]
    s29["landmark-fit-repair"]
    s30["mascot-logo-reconstruction"]
    s31["multiview-constraint-solver"]
    s32["multiview-fit-loop"]
    s33["orbital-hud-motion"]
    s34["orthographic-registration"]
    s35["quality-refinement-autoloop"]
    s36["reference-analysis-validator"]
    s37["reference-look-calibration"]
    s38["reference-to-3d"]
    s39["source-part-segmentation"]
    s40["text-to-blender"]
    s41["texture-driven-mesh-fitting"]
    s42["texture-state-animation"]
    s43["wireframe-to-3d"]
  end
  r0(["reference"])
  director --> r0
  r0 --> s13
  r0 -.-> s24
  r0 -.-> s36
  r0 -.-> s34
  r0 -.-> s38
  r0 -.-> s32
  r0 -.-> s37
  r0 -.-> s18
  r1(["hard-surface"])
  director --> r1
  r1 --> s13
  r1 -.-> s0
  r1 -.-> s5
  r1 -.-> s8
  r1 -.-> s11
  r1 -.-> s6
  r1 -.-> s18
  r2(["procedural"])
  director --> r2
  r2 --> s0
  r2 -.-> s2
  r2 -.-> s11
  r2 -.-> s6
  r2 -.-> s18
  r3(["organic"])
  director --> r3
  r3 --> s13
  r3 -.-> s0
  r3 -.-> s10
  r3 -.-> s8
  r3 -.-> s12
  r3 -.-> s11
  r3 -.-> s18
  r4(["motion"])
  director --> r4
  r4 --> s13
  r4 -.-> s1
  r4 -.-> s17
  r4 -.-> s14
  r4 -.-> s18
  r5(["lookdev"])
  director --> r5
  r5 --> s0
  r5 -.-> s11
  r5 -.-> s6
  r5 -.-> s23
  r6(["repair"])
  director --> r6
  r6 --> s13
  r6 -.-> s24
  r6 -.-> s35
  r6 -.-> s28
  r6 -.-> s8
  r6 -.-> s32
  r7(["web-asset"])
  director --> r7
  r7 --> s13
  r7 -.-> s18
  r7 -.-> s12
  r7 -.-> s8
  r8(["scene"])
  director --> r8
  r8 --> s13
  r8 -.-> s22
  r8 -.-> s5
  r8 -.-> s20
  r8 -.-> s19
  r8 -.-> s17
  r8 -.-> s23
  r8 -.-> s18
  director -->|specialist-backbone| s0
  director -->|default-lead| s13
  director -->|conflict-resolution| s24
  director -->|execution-backend| mcp
  s13 -->|optional-reference-specialist| s24
  s24 -->|source-manifest-before-modeling| s36
  s36 -->|multi-view-gate| s34
  s34 -->|reconstruction| s38
  s38 -->|validate| s32
  s32 -->|export-after-validation| s18
  s5 -->|cleanup| s8
  s10 -->|cleanup| s8
  s8 -->|unwrap-bake| s12
  s12 -->|lookdev| s11
  s11 -->|lighting| s6
  s1 -->|frame-validation| s14
  s35 -->|diagnosis-first| s28
~~~

## Interpretation

Solid edges are selected lead or declared dependencies; dotted route edges indicate optional specialist candidates, not unconditional execution. The MCP node is a tool backend, not an Agent Skill.

**One lead at a time; inspect the scene before edits; validate results visually.**

Regenerate after intentionally changing the catalog:

    python3 scripts/blender_skill_graph.py --graph > docs/BLENDER_SKILL_GRAPH.md
