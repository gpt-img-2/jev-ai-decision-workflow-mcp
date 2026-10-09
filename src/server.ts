import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { loadConfig } from "./config.js";
import {
  buildTypedDecisionSpec,
  getJevAIResources,
  reviewTypedDecisionResult,
  validateDecisionBatch,
} from "./toolkit.js";

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
const instructions = `Jev AI Decision Workflow MCP is deterministic and read-only. It structures typed Yes/No, Choice, and Score workflows from user-supplied data, validates batch shape, reviews result completeness, and returns canonical public resources. It does not call models, estimate accuracy, calibrate probability, access accounts, consume credits, submit jobs, read private data, or make consequential decisions. Human review remains required for high-risk use.`;

export function createServer() {
  const config = loadConfig();
  const server = new McpServer({ name: "jev-ai-decision-workflow-mcp", version: "1.0.0" }, { instructions });

  server.registerTool("build_typed_decision_spec", {
    title: "Build a typed decision specification",
    description: "Define an inspectable Yes/No, Choice, or Score workflow with criteria and risk controls.",
    inputSchema: z.object({
      decisionName: z.string().max(200),
      inputDescription: z.string().max(1000),
      question: z.string().max(1000),
      decisionType: z.enum(["yes-no", "choice", "score"]),
      choices: z.array(z.string().min(1).max(200)).max(30).optional(),
      scoreMin: z.number().optional(),
      scoreMax: z.number().optional(),
      criteria: z.array(z.string().min(1).max(500)).max(30),
      riskLevel: z.enum(["low", "medium", "high"]),
    }), annotations,
  }, async (params) => text(buildTypedDecisionSpec(params)));

  server.registerTool("validate_decision_batch", {
    title: "Validate a typed decision batch",
    description: "Check user-supplied record ids, empty inputs, duplicates, and length limits without sending data to a model.",
    inputSchema: z.object({
      records: z.array(z.object({ id: z.string().max(200), text: z.string().max(200000) })).min(1).max(1000),
      maxCharactersPerRecord: z.number().int().positive().max(200000).default(20000),
    }), annotations,
  }, async (params) => text(validateDecisionBatch(params)));

  server.registerTool("review_typed_decision_result", {
    title: "Review a typed decision result",
    description: "Check result completeness, evidence, probability presence, and human-review requirements.",
    inputSchema: z.object({
      decisionType: z.enum(["yes-no", "choice", "score"]),
      answer: z.string().max(2000),
      probability: z.number().min(0).max(1).optional(),
      rationale: z.string().max(5000).optional(),
      evidence: z.array(z.string().min(1).max(1000)).max(30).optional(),
      riskLevel: z.enum(["low", "medium", "high"]),
      humanReviewed: z.boolean(),
    }), annotations,
  }, async (params) => text(reviewTypedDecisionResult(params)));

  server.registerTool("get_jev_ai_resources", {
    title: "Get canonical Jev AI resources",
    description: "Return canonical public workflow, API, guide, and policy pages without fetching external content.",
    inputSchema: z.object({ topic: z.enum(["all", "workflow", "api", "guides", "policy"]).default("all") }), annotations,
  }, async ({ topic }) => text({ topic, resources: getJevAIResources(config.appBaseUrl, topic), rawSkillUrl: `${config.appBaseUrl}/skills/jev-ai-decision-workflow/SKILL.md` }));

  return server;
}
