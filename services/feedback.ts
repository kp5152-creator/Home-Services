import { promises as fs } from "fs";
import path from "path";
import type { FeedbackRecord, FeedbackSentiment, FeedbackType } from "@/utils/types";

const feedbackPath = path.join(process.cwd(), "data", "feedback.json");
const feedbackTypes = new Set<FeedbackType>([
  "Thumbs Up",
  "Thumbs Down",
  "Feature Request",
  "Bug Report",
  "Post Inspection",
  "Homeowner Satisfaction"
]);
const sentiments = new Set<FeedbackSentiment>(["Positive", "Neutral", "Negative"]);

export async function readFeedback() {
  try {
    const raw = await fs.readFile(feedbackPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as FeedbackRecord[]) : [];
  } catch {
    return [];
  }
}

export async function addFeedback(input: Partial<FeedbackRecord>) {
  const feedback: FeedbackRecord = {
    id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    type: feedbackTypes.has(input.type as FeedbackType) ? (input.type as FeedbackType) : "Feature Request",
    sentiment: sentiments.has(input.sentiment as FeedbackSentiment) ? (input.sentiment as FeedbackSentiment) : "Neutral",
    role: cleanText(input.role, 80) || "Unknown",
    screen: cleanText(input.screen, 80) || "Unknown",
    propertyId: cleanText(input.propertyId, 120),
    message: cleanText(input.message, 1000) || "No message provided.",
    email: cleanText(input.email, 180),
    rating: normalizeRating(input.rating)
  };

  await fs.mkdir(path.dirname(feedbackPath), { recursive: true });
  const existing = await readFeedback();
  await fs.writeFile(feedbackPath, JSON.stringify([feedback, ...existing].slice(0, 1000), null, 2));
  return feedback;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function normalizeRating(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  return Math.min(5, Math.max(1, Math.round(number)));
}
