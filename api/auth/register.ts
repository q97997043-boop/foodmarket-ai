import { registerUser } from "../lib/auth-service";
import { logApi } from "../lib/log";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, restaurantName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await registerUser({
      email,
      password,
      restaurantName,
    });

    logApi("register-endpoint", "registration successful", { email });
    return res.status(200).json(result);
  } catch (err) {
    logApi("register-endpoint", "error", {
      message: err instanceof Error ? err.message : String(err),
    });

    if (err instanceof Error) {
      const msg = err.message;
      if (msg.includes("already exists") || msg.includes("CONFLICT")) {
        return res.status(409).json({ error: "User already exists" });
      }
      if (msg.includes("minimum length") || msg.includes("validation")) {
        return res.status(400).json({ error: msg });
      }
    }

    return res.status(500).json({ error: "Registration failed" });
  }
}