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

  throw new Error("AI provider integration is not implemented yet.");
}

export function getAiProviderGuardrails() {
  return {
    systemPrompt: ESTATEIQ_AI_SYSTEM_PROMPT,
    privacyRules: ESTATEIQ_AI_PRIVACY_RULES,
    reviewRules: ESTATEIQ_AI_REVIEW_RULES
  };
}
