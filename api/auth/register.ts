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
    const body = parseJsonBody(rawBody ?? {});

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
    return res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Registration failed",
    });
  }
}
