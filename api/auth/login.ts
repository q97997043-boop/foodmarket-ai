import { VercelRequest, VercelResponse } from "@vercel/node";
import { loginUser } from "../lib/auth-service";
import { logApi } from "../lib/log";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!body) {
      return res.status(400).json({
        error: "Missing request body",
      });
    }

    const { email, password } = body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        fields: ["email", "password"],
      });
    }

    const result = await loginUser({
      email: String(email).trim(),
      password: String(password),
    });

    logApi("login-endpoint", "success", { email });

    return res.status(200).json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logApi("login-endpoint", "error", { message: errorMsg });

    if (errorMsg.includes("Invalid credentials")) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    return res.status(500).json({
      error: "Login failed",
      details: errorMsg,
    });
  }
}