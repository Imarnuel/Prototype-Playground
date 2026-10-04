# better-interface cannot run a real review yet

This directory holds the **orchestrator only**. `better-interface` owns routing and
explicitly owns no rules of its own:

> Orchestration is all it owns. Accessibility rules belong to `better-accessibility`,
> structure to `better-layout`, copy to `better-writing`, type to `better-typography`,
> color to `better-colors`, visual polish and motion to `better-ui`.

## Not installed

None of the six domain skills is present anywhere on this machine:

| Domain skill | Owns |
|---|---|
| `better-accessibility` | Accessibility |
| `better-layout` | Structure |
| `better-writing` | Copy |
| `better-typography` | Type |
| `better-colors` | Color |
| `better-ui` | Visual polish **and motion** |

## What that means

SKILL.md §4 is explicit: *"If an owning skill is unavailable, mark that domain
`Not reviewed`, name it and continue with the rest. Do not recreate its rules from
memory, substitute a neighbour, or claim holistic coverage."*

With none of the six installed, every domain is `Not reviewed` and the report has
nothing to say. Install the six alongside this directory before invoking it.

`interface-review` (the change-scoped entry point referenced in §2) is also absent.

## openai.yaml

Kept for fidelity with the source bundle. It is an OpenAI-style manifest
(`display_name` / `short_description`) and is **not read by Claude Code**, which
discovers a skill from the YAML frontmatter in `SKILL.md`.
