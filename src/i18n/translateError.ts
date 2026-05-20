import type { Locale } from "./config";
import { translate } from "./index";

const ERROR_MAP: Record<string, string> = {
  "User already exists": "errors.userExists",
  "Invalid credentials": "errors.invalidCredentials",
  "Email and password are required": "errors.emailPasswordRequired",
  "Password must be at least 6 characters": "errors.passwordMin",
  "Registration failed": "errors.registrationFailed",
  "Login failed": "errors.loginFailed",
  "Failed to fetch": "errors.network",
  "Cannot reach the server. Run npm run dev and open the URL it prints (e.g. http://localhost:3000).":
    "errors.network",
};

export function translateError(message: string, locale: Locale): string {
  const key = ERROR_MAP[message];
  if (key) return translate(locale, key);
  return message;
}
