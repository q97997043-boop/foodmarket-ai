import { VercelRequest, VercelResponse } from "@vercel/node";
import { registerUser } from "../lib/auth-service";
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

    const { email, password, restaurantName } = body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        fields: ["email", "password"],
      });
    }

    const result = await registerUser({
      email: String(email).trim(),
      password: String(password),
      restaurantName: restaurantName ? String(restaurantName).trim() : undefined,
    });

    logApi("register-endpoint", "success", { email });

    return res.status(200).json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logApi("register-endpoint", "error", { message: errorMsg });

    if (errorMsg.includes("already exists")) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    return res.status(500).json({
      error: "Registration failed",
      details: errorMsg,
    });
  }
}