export type DecisionType = "yes-no" | "choice" | "score";
export type RiskLevel = "low" | "medium" | "high";
export type ResourceTopic = "all" | "workflow" | "api" | "guides" | "policy";

function clean(value: string | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function cleanList(values: string[] | undefined) {
  return [...new Set((values || []).map(clean).filter(Boolean))];
}

export function buildTypedDecisionSpec(params: {
  decisionName: string;
  inputDescription: string;
  question: string;
  decisionType: DecisionType;
  choices?: string[] | undefined;
  scoreMin?: number | undefined;
  scoreMax?: number | undefined;
  criteria: string[];
  riskLevel: RiskLevel;
}) {
  const decisionName = clean(params.decisionName);
  const inputDescription = clean(params.inputDescription);
  const question = clean(params.question);
  const criteria = cleanList(params.criteria);
  const choices = cleanList(params.choices);
  const blockers = [
    !decisionName ? "Give the decision workflow a name." : "",
    !inputDescription ? "Describe the input records." : "",
    !question ? "Define the exact question to answer." : "",
    criteria.length === 0 ? "Provide at least one decision criterion." : "",
    params.decisionType === "choice" && choices.length < 2
      ? "Choice decisions require at least two distinct options."
      : "",
    params.decisionType === "score" &&
    (params.scoreMin === undefined ||
      params.scoreMax === undefined ||
      params.scoreMin >= params.scoreMax)
      ? "Score decisions require a minimum lower than the maximum."
      : "",
  ].filter(Boolean);

  const answerSchema =
    params.decisionType === "yes-no"
      ? { type: "boolean", allowed: ["yes", "no"] }
      : params.decisionType === "choice"
        ? { type: "choice", allowed: choices }
        : { type: "number", minimum: params.scoreMin, maximum: params.scoreMax };

  return {
    ready: blockers.length === 0,
    blockers,
    decisionName,
    inputDescription,
    question,
    decisionType: params.decisionType,
    criteria,
    answerSchema,
    riskLevel: params.riskLevel,
    requiresHumanReview: params.riskLevel === "high",
    validationPlan: [
      "Create a labeled representative dataset before production use.",
      "Measure errors by class or score band, not only overall agreement.",
      "Review low-probability and consequential outputs manually.",
      "Treat model-reported probability as an estimate, not calibrated confidence, unless calibration is demonstrated.",
    ],
  };
}

export function validateDecisionBatch(params: {
  records: Array<{ id: string; text: string }>;
  maxCharactersPerRecord: number;
}) {
  const seen = new Set<string>();
  const records = params.records.map((record, index) => {
    const id = clean(record.id);
    const text = clean(record.text);
    const issues = [
      !id ? "Missing record id." : "",
      id && seen.has(id) ? "Duplicate record id." : "",
      !text ? "Input text is empty." : "",
      text.length > params.maxCharactersPerRecord
        ? `Input exceeds ${params.maxCharactersPerRecord} characters.`
        : "",
    ].filter(Boolean);
    if (id) seen.add(id);
    return { row: index + 1, id: id || null, characters: text.length, issues };
  });
  return {
    ready: records.every((record) => record.issues.length === 0),
    recordCount: records.length,
    validCount: records.filter((record) => record.issues.length === 0).length,
    records,
    boundary: "Validation checks structure only; it does not send records to a model or predict output quality.",
  };
}

export function reviewTypedDecisionResult(params: {
  decisionType: DecisionType;
  answer: string;
  probability?: number | undefined;
  rationale?: string | undefined;
  evidence?: string[] | undefined;
  riskLevel: RiskLevel;
  humanReviewed: boolean;
}) {
  const answer = clean(params.answer);
  const evidence = cleanList(params.evidence);
  const blockers = [
    !answer ? "The answer is empty." : "",
    params.riskLevel === "high" && !params.humanReviewed
      ? "High-risk decisions require human review before action."
      : "",
  ].filter(Boolean);
  const warnings = [
    params.probability === undefined ? "No probability was supplied." : "",
    !clean(params.rationale) ? "No rationale was supplied." : "",
    evidence.length === 0 ? "No supporting evidence or test reference was supplied." : "",
  ].filter(Boolean);
  return {
    readyForUse: blockers.length === 0,
    blockers,
    warnings,
    decisionType: params.decisionType,
    answer,
    probability: params.probability ?? null,
    rationale: clean(params.rationale) || null,
    evidence,
    interpretation:
      "This review checks completeness and escalation rules. It does not verify the underlying model answer or calibrate its probability.",
  };
}

const resources = [
  { topic: "workflow", title: "Jev AI Playground", path: "/", purpose: "Define and test typed decisions." },
  { topic: "workflow", title: "Batch Processing", path: "/batch", purpose: "Review the public batch workflow." },
  { topic: "workflow", title: "What is Jev?", path: "/what-is-jev", purpose: "Understand the product boundary and use cases." },
  { topic: "api", title: "Jev API", path: "/jev-api", purpose: "Review public API integration information." },
  { topic: "guides", title: "Use Cases", path: "/use-cases/support-ticket-triage", purpose: "Review a typed routing example." },
  { topic: "guides", title: "Comparisons", path: "/compare/jev-vs-openjev", purpose: "Review the public comparison methodology." },
  { topic: "policy", title: "About", path: "/about", purpose: "Read product and editorial context." },
  { topic: "policy", title: "Privacy Policy", path: "/privacy-policy", purpose: "Review current data-handling terms." },
  { topic: "policy", title: "Terms of Service", path: "/terms-of-service", purpose: "Review current usage terms." },
] as const;

export function getJevAIResources(appBaseUrl: string, topic: ResourceTopic) {
  return resources
    .filter((item) => topic === "all" || item.topic === topic)
    .map((item) => ({ ...item, url: `${appBaseUrl}${item.path}` }));
}
