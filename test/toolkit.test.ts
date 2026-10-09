import assert from "node:assert/strict";
import test from "node:test";
import { buildTypedDecisionSpec, getJevAIResources, reviewTypedDecisionResult, validateDecisionBatch } from "../src/toolkit.js";

test("requires distinct choices", () => {
  const result = buildTypedDecisionSpec({ decisionName: "Route", inputDescription: "Ticket", question: "Who owns it?", decisionType: "choice", choices: ["Sales", "Sales"], criteria: ["Intent"], riskLevel: "low" });
  assert.equal(result.ready, false);
});

test("builds a score specification", () => {
  const result = buildTypedDecisionSpec({ decisionName: "Risk", inputDescription: "Review", question: "Risk score?", decisionType: "score", scoreMin: 0, scoreMax: 10, criteria: ["Evidence", "Impact"], riskLevel: "high" });
  assert.equal(result.ready, true);
  assert.equal(result.requiresHumanReview, true);
});

test("finds duplicate and empty batch records", () => {
  const result = validateDecisionBatch({ records: [{ id: "a", text: "one" }, { id: "a", text: "" }], maxCharactersPerRecord: 100 });
  assert.equal(result.ready, false);
  assert.equal(result.validCount, 1);
  assert.equal(result.records[1]?.issues.length, 2);
});

test("blocks unreviewed high-risk result", () => {
  const result = reviewTypedDecisionResult({ decisionType: "yes-no", answer: "yes", probability: 0.8, riskLevel: "high", humanReviewed: false });
  assert.equal(result.readyForUse, false);
  assert.equal(result.blockers.length, 1);
});

test("accepts reviewed evidenced result", () => {
  const result = reviewTypedDecisionResult({ decisionType: "choice", answer: "Support", probability: 0.9, rationale: "Matches support intent", evidence: ["Labeled test set"], riskLevel: "medium", humanReviewed: true });
  assert.equal(result.readyForUse, true);
  assert.equal(result.warnings.length, 0);
});

test("resources use configured origin", () => {
  const result = getJevAIResources("https://ai-jev.pro", "api");
  assert.equal(result.length, 1);
  assert.match(result[0]?.url || "", /^https:\/\/ai-jev\.pro\//);
});
