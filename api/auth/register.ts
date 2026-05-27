import type { VercelRequest, VercelResponse } from "@vercel/node";
import { registerUser } from "../lib/auth-service";

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
  res: VercelResponse,
) {
  res.setHeader("Content-Type", "application/json");
  console.log("REGISTER HEADERS", req.headers);
  console.log("REGISTER BODY", req.body);

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
      method: req.method,
    });
  }

  try {
    const rawBody = req.body;
    let body;
    try {
      body = parseJsonBody(rawBody ?? {});
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON body",
        error: String(parseError),
      });
    }

    if (!body?.email || !body?.password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await registerUser({
      email: String(body?.email ?? ""),
      password: String(body?.password ?? ""),
      restaurantName: body?.restaurantName ? String(body.restaurantName) : undefined,
    });

    console.log("REGISTER RESULT", result);

    return res.status(200).json({
      success: true,
      token: result.token,
      restaurantId: result.user.restaurantId,
      user: result.user,
    });
  } catch (err) {
    console.error("REGISTER ERROR", err);
    try {
      console.error((err as any)?.stack ?? String(err));
    } catch (e) {
      /* ignore */
    }
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Registration failed",
      error: String(err),
    });
  }
}
