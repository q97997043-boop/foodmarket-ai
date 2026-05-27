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
  res: VercelResponse,
) {
  try {
    res.setHeader("Content-Type", "application/json");
    console.log("LOGIN HEADERS", req.headers);
    console.log("LOGIN BODY", req.body);

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
        method: req.method,
      });
    }

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

    const result = await loginUser({
      email: String(body?.email ?? "").trim(),
      password: String(body?.password ?? ""),
    });

    console.log("LOGIN RESULT", result);

    return res.status(200).json({
      success: true,
      token: result.token,
      restaurantId: result.user.restaurantId,
      user: result.user,
    });
  } catch (err: any) {
    console.error("LOGIN ROUTE CRASH:", err);
    if (err && err.stack) {
      console.error(err.stack);
    }
    try {
      return res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Login failed",
        error: String(err),
        stack: err && err.stack ? String(err.stack) : undefined,
      });
    } catch (sendError) {
      console.error("FAILED TO SEND JSON ERROR RESPONSE:", sendError);
      try {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: false,
          message: "Login failed critical error",
          error: String(err),
        }));
      } catch (fatalError) {
        console.error("FATAL ERROR IN RESPONDING:", fatalError);
      }
    }
  }
}
