import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      method: req.method,
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Temporary debug response to verify routing returns JSON (not HTML)
    return res.status(200).json({
      success: true,
      route: "login api works",
      received: { email: body?.email ?? null },
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: String(err),
    });
  }
}