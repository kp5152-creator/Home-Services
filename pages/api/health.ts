import type { NextApiRequest, NextApiResponse } from "next";
import { hasSupabaseConfig, storageBucket, supabaseAdmin } from "@/services/supabaseAdmin";

type HealthResponse = {
  ok: boolean;
  checkedAt: string;
  databaseMode: "supabase" | "local-json";
  passwordProtectionEnabled: boolean;
  supabase: {
    configured: boolean;
    storageBucket: string;
    bucketReachable: boolean | null;
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
  }

  response.status(200).json({
    ok: !configured || bucketReachable === true,
    checkedAt: new Date().toISOString(),
    databaseMode: configured ? "supabase" : "local-json",
    passwordProtectionEnabled: Boolean(process.env.APP_PASSWORD),
    supabase: {
      configured,
      storageBucket: bucket,
      bucketReachable,
      message
    }
  });
}
