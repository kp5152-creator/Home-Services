import type { NextApiRequest, NextApiResponse } from "next";
import { readAnalyticsEvents } from "@/services/analytics";
import { buildUsageFromAnalytics, readPilotDatabase, resetPilotAccount, writePilotDatabase } from "@/services/pilot";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method === "GET") {
    const [pilot, analytics] = await Promise.all([readPilotDatabase(), readAnalyticsEvents()]);
    response.status(200).json({ pilot, usageSummary: buildUsageFromAnalytics(analytics) });
    return;
  }

  if (request.method === "POST") {
    const action = String(request.body?.action ?? "");

    if (action === "toggle-feature") {
      const featureId = String(request.body?.featureId ?? "");
      const pilot = await readPilotDatabase();
      const nextPilot = {
        ...pilot,
        featureFlags: pilot.featureFlags.map((feature) =>
          feature.id === featureId ? { ...feature, enabled: !feature.enabled } : feature
        )
      };
      await writePilotDatabase(nextPilot);
      response.status(200).json({ pilot: nextPilot });
      return;
    }

    if (action === "reset-account") {
      const organizationId = String(request.body?.organizationId ?? "");
      const pilot = await resetPilotAccount(organizationId);
      if (!pilot) {
        response.status(404).json({ message: "Pilot organization not found." });
        return;
      }
      response.status(200).json({ pilot });
      return;
    }

    response.status(400).json({ message: "Unknown pilot action." });
    return;
  }

  response.setHeader("Allow", "GET, POST");
  response.status(405).json({ message: "Method not allowed" });
}
