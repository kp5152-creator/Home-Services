import type { NextApiRequest, NextApiResponse } from "next";
import { isAiProviderEnabled } from "@/services/aiClient";
import { readDatabase } from "@/services/database";
import { hasSupabaseConfig, storageBucket, supabaseAdmin } from "@/services/supabaseAdmin";

type HealthResponse = {
  ok: boolean;
  checkedAt: string;
  databaseMode: "supabase" | "local-json";
  passwordProtectionEnabled: boolean;
  deployment: {
    environment: string;
    commitSha: string | null;
    branch: string | null;
    region: string | null;
  };
  supabase: {
    configured: boolean;
    storageBucket: string;
    bucketReachable: boolean | null;
    databaseReachable: boolean | null;
    message: string;
  };
  ai: {
    configured: boolean;
    enabled: boolean;
    message: string;
  };
};

export default async function handler(request: NextApiRequest, response: NextApiResponse<HealthResponse | { message: string }>) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const configured = hasSupabaseConfig();
  const bucket = storageBucket();
  let bucketReachable: boolean | null = null;
  let databaseReachable: boolean | null = null;
  let message = configured ? "Supabase environment variables are present." : "Using local JSON storage.";

  if (configured) {
    try {
      const { data, error } = await supabaseAdmin().storage.getBucket(bucket);
      bucketReachable = Boolean(data && !error);
      message = bucketReachable
        ? "Supabase storage bucket is reachable."
        : `Supabase configured, but storage bucket "${bucket}" was not reachable.`;
    } catch (error) {
      bucketReachable = false;
      message = error instanceof Error ? error.message : "Supabase health check failed.";
    }

    try {
      await readDatabase();
      databaseReachable = true;
    } catch (error) {
      databaseReachable = false;
      const databaseMessage = error instanceof Error ? error.message : "Supabase database read failed.";
      message = bucketReachable === false ? `${message} Database: ${databaseMessage}` : databaseMessage;
    }
  }

  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.status(200).json({
    ok: !configured || (bucketReachable === true && databaseReachable === true),
    checkedAt: new Date().toISOString(),
    databaseMode: configured ? "supabase" : "local-json",
    passwordProtectionEnabled: Boolean(process.env.APP_PASSWORD),
    deployment: {
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "local",
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      branch: process.env.VERCEL_GIT_COMMIT_REF || null,
      region: process.env.VERCEL_REGION || null
    },
    supabase: {
      configured,
      storageBucket: bucket,
      bucketReachable,
      databaseReachable,
      message
    },
    ai: {
      configured: Boolean(process.env.OPENAI_API_KEY),
      enabled: isAiProviderEnabled(),
      message: isAiProviderEnabled()
        ? "Live AI provider calls are enabled."
        : "Live AI provider calls are disabled; rules-assisted helpers are active."
    }
  });
}
