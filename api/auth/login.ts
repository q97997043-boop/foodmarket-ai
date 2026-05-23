import { loginUser } from "../lib/auth-service";
import { logApi } from "../lib/log";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse | void> {
  res.setHeader("Content-Type", "application/json");

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse body - handle both parsed and raw body
    let body: Record<string, unknown>;
    
    if (typeof req.body === "string") {
      body = JSON.parse(req.body);
    } else if (req.body) {
      body = req.body as Record<string, unknown>;
    } else {
      return res.status(400).json({ error: "Missing request body" });
    }

    const { email, password } = body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields: email and password" });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid field types" });
    }

    const result = await loginUser({
      email: email.trim(),
      password,
    });

    logApi("login-endpoint", "login successful", { email });
    return res.status(200).json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logApi("login-endpoint", "error", { message: errorMsg });

    if (err instanceof Error) {
      if (errorMsg.includes("Invalid credentials") || errorMsg.includes("UNAUTHORIZED")) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    return res.status(500).json({ error: "Login failed", details: errorMsg });
  }
}