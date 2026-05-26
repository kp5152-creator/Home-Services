import type { NextApiRequest, NextApiResponse } from "next";
import { addFeedback, readFeedback } from "@/services/feedback";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method === "GET") {
    response.status(200).json({ feedback: await readFeedback() });
    return;
  }

  if (request.method === "POST") {
    const feedback = await addFeedback(request.body ?? {});
    response.status(201).json({ feedback });
    return;
  }

  response.setHeader("Allow", "GET, POST");
  response.status(405).json({ message: "Method not allowed" });
}
