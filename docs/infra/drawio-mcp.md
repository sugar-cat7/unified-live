# Creating Architecture Diagrams with Draw.io MCP

## Research Summary

Research date: 2026-02-28

The `drawio-mcp` official repository presents the following approaches for creating architecture diagrams:

1. MCP App Server (`https://mcp.draw.io/mcp`)
2. MCP Tool Server (`@drawio/mcp`)
3. Skill + CLI (`.drawio` file generation)
4. Project Instructions (no MCP required)

This template **adopts `MCP Tool Server` as the standard for highly reproducible operation with Claude Code**.

- Reason 1: Can directly use `open_drawio_mermaid` / `open_drawio_xml` / `open_drawio_csv`
- Reason 2: Easy to commit to the project's `.mcp.json` and share with the team
- Reason 3: Can explicitly define operational rules together with Claude's `settings.json` `permissions.allow`

## Project Standard Configuration

### 1. MCP Server Definition (Project Scope)

Project root `.mcp.json`:

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "env": {}
    }
  }
}
```

### 2. Claude Code Permission Settings

Project root `.claude/settings.json`:

- `permissions.allow` includes read-only commands (`ls`, `cat`, `grep`, `rg`)
- Git reference commands (`git diff`, `git log`, `git show`)

## Architecture Diagram Creation Flow (Standard)

1. Extract architectural components from existing docs (frontend/backend/infra/domain)
2. First create a draft using `open_drawio_mermaid`
3. Switch to `open_drawio_xml` if layout adjustments are needed
4. Save the final artifact as `.drawio` in `docs/infra/diagrams/`
5. Append the change intent and how to read the diagram to the markdown files under `docs/infra/`

## Initial Diagrams for This Template

- `docs/infra/diagrams/template-services-architecture.drawio`

This diagram illustrates the following separation of concerns:

- Browser / Next.js Web / Hono API / Database
- OAuth Provider (Google)
- IaC and deployment via Terraform + GitHub Actions

## Recommended Prompt Examples

- `Create an overall architecture diagram for this repository using the draw.io MCP. Start with open_drawio_mermaid.`
- `Create a version with color-coded communication paths between web/api/db using open_drawio_xml.`

## References

- drawio-mcp official: https://github.com/jgraph/drawio-mcp
- drawio-mcp tool server: https://github.com/jgraph/drawio-mcp/tree/main/mcp-tool-server
- Claude Code MCP: https://docs.anthropic.com/en/docs/claude-code/mcp
- Claude Code settings/permissions: https://docs.anthropic.com/en/docs/claude-code/settings
