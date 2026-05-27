import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loginUser } from "../lib/auth-service";

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

    const result = await loginUser({
      email: String(body?.email ?? ""),
      password: String(body?.password ?? ""),
    });

    return res.status(200).json({
      success: true,
      token: result.token,
      restaurantId: result.user.restaurantId,
      user: result.user,
    });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Login failed",
    });
  }
}