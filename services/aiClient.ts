import {
  ESTATEIQ_AI_PRIVACY_RULES,
  ESTATEIQ_AI_REVIEW_RULES,
  ESTATEIQ_AI_SYSTEM_PROMPT
} from "@/ai";

export type AiDraftRequest = {
  task: "inspection_summary" | "maintenance_recommendation" | "owner_report" | "risk_signal";
  facts: Record<string, string | number | boolean | null | string[]>;
};

export type AiDraftResponse = {
  text: string;
  provider: "disabled" | "openai";
  requiresHumanReview: true;
};

export function isAiProviderEnabled() {
  return process.env.ESTATEIQ_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
}

export async function requestAiDraft(_request: AiDraftRequest): Promise<AiDraftResponse> {
  if (!isAiProviderEnabled()) {
    return {
      text: "",
      provider: "disabled",
      requiresHumanReview: true
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_output_tokens: 260,
      input: [
        {
          role: "system",
          content: [
            ESTATEIQ_AI_SYSTEM_PROMPT,
            "Return only the final draft text. Do not wrap it in markdown.",
            ...ESTATEIQ_AI_PRIVACY_RULES,
            ...ESTATEIQ_AI_REVIEW_RULES
          ].join("\n")
        },
        {
          role: "user",
          content: buildDraftInstruction(_request)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };
  const text =
    data.output_text?.trim() ||
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("\n")
      .trim() ||
    "";

  return {
    text,
    provider: "openai",
    requiresHumanReview: true
  };
}

export function getAiProviderGuardrails() {
  return {
    systemPrompt: ESTATEIQ_AI_SYSTEM_PROMPT,
    privacyRules: ESTATEIQ_AI_PRIVACY_RULES,
    reviewRules: ESTATEIQ_AI_REVIEW_RULES
  };
}

function buildDraftInstruction(request: AiDraftRequest) {
  return [
    `Task: ${request.task}`,
    "Draft a concise homeowner-ready inspection summary from these facts.",
    "Use 3 to 5 calm sentences.",
    "Mention urgent items only if the facts say urgent is true.",
    "Do not include private access details, contact details, or unsupported claims.",
    JSON.stringify(request.facts, null, 2)
  ].join("\n\n");
}
