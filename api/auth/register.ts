import type { VercelRequest, VercelResponse } from "@vercel/node";

function parseJsonBody(body: unknown) {
  if (typeof body === "string") {
    return JSON.parse(body);
  }
  if (body instanceof Uint8Array) {
    return JSON.parse(new TextDecoder().decode(body));
  }
  if (body instanceof ArrayBuffer) {
    return JSON.parse(new TextDecoder().decode(new Uint8Array(body)));
  }
  return body;
}

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
    const rawBody = req.body;
    const body = parseJsonBody(rawBody ?? {});

    return res.status(200).json({
      success: true,
      token: "demo-token",
      user: {
        id: "1",
        email: String(body?.email ?? "demo@example.com"),
        role: "OWNER",
        restaurantId: null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: String(err),
    });
  }
}