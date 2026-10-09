export type JevAIConfig = { appBaseUrl: string };

function parseBaseUrl(value: string | undefined) {
  const candidate = (value || "https://ai-jev.pro").trim().replace(/\/+$/, "");
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Jev AI base URL must use http or https.");
  }
  return url.toString().replace(/\/+$/, "");
}

export function loadConfig(): JevAIConfig {
  return { appBaseUrl: parseBaseUrl(process.env.JEV_AI_BASE_URL) };
}
