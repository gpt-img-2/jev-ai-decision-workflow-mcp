import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const expectedTools = ["build_typed_decision_spec", "validate_decision_batch", "review_typed_decision_result", "get_jev_ai_resources"];
const command = process.env.MCP_SMOKE_COMMAND || "node";
const args = process.env.MCP_SMOKE_ARGS_JSON ? JSON.parse(process.env.MCP_SMOKE_ARGS_JSON) : ["bin/jev-ai-decision-workflow-mcp.js"];
const client = new Client({ name: "jev-ai-decision-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({ command, args, cwd: process.cwd() });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);
  assert.deepEqual([...names].sort(), [...expectedTools].sort());
  const result = await client.callTool({ name: "get_jev_ai_resources", arguments: { topic: "api" } });
  const first = result.content?.[0];
  assert.match(first?.type === "text" ? first.text : "", /ai-jev\.pro/);
  console.log(`MCP smoke passed: ${names.join(", ")}`);
} finally {
  await client.close();
}
