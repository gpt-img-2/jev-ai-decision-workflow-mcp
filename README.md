# Jev AI Decision Workflow MCP

Deterministic, read-only MCP tools and an OpenClaw Skill for defining typed Yes/No, Choice, and Score workflows, validating batch inputs, reviewing result completeness, and discovering canonical Jev AI resources.

The server does not call models, access accounts, consume credits, submit jobs, read private data, or make consequential decisions. Model-reported probabilities are not treated as independently calibrated confidence, and high-risk workflows require human review.

## Install

```bash
npx -y github:gpt-img-2/jev-ai-decision-workflow-mcp
```

## Tools

- `build_typed_decision_spec`
- `validate_decision_batch`
- `review_typed_decision_result`
- `get_jev_ai_resources`

## OpenClaw

```bash
openclaw mcp add jev-ai --command npx --arg -y --arg github:gpt-img-2/jev-ai-decision-workflow-mcp
```

The Skill source is in [`openclaw/jev-ai-decision-workflow`](openclaw/jev-ai-decision-workflow/SKILL.md).

## Development

```bash
pnpm install
pnpm validate
```

Canonical product resources: [ai-jev.pro/llms.txt](https://ai-jev.pro/llms.txt)
