import { loginUser } from "../lib/auth-service";
import { logApi } from "../lib/log";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await loginUser({
      email,
      password,
    });

    logApi("login-endpoint", "login successful", { email });
    return res.status(200).json(result);
  } catch (err) {
    logApi("login-endpoint", "error", {
      message: err instanceof Error ? err.message : String(err),
    });

    if (err instanceof Error) {
      const msg = err.message;
      if (msg.includes("Invalid credentials") || msg.includes("UNAUTHORIZED")) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    return res.status(500).json({ error: "Login failed" });
  }
}