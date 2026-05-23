import { logInit } from "./init-log";
import type { User } from "../providers/AuthProvider";

export type AuthResponse = {
  token: string;
  user: User;
};

async function readJsonError(res: Response): Promise<string> {
  const text = await res.text();
  console.log("Raw error response:", text, { status: res.status, statusText: res.statusText });

  let data: { error?: string; message?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
    console.log("Parsed error response:", data);
  } catch (err) {
    console.error("JSON parse failed in readJsonError:", err, text);
    return `Request failed (${res.status})`;
  }

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message === "string") return data.message;
  return `Request failed (${res.status})`;
}

/** REST fallback when tRPC network fails */
export async function registerViaRest(input: {
  email: string;
  password: string;
  restaurantName?: string;
}): Promise<AuthResponse> {
  const url = "/api/auth/register";
  logInit("register", "REST fallback request", { email: input.email, url, method: "POST" });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  console.log("Register request URL:", url, "status:", res.status, "statusText:", res.statusText);

  const text = await res.text();
  console.log("Raw response:", text);

  let data: AuthResponse | { error?: string; message?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
    console.log("Parsed JSON:", data);
  } catch (err) {
    console.error("JSON parse failed:", err, text);
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    console.error("Register REST request failed:", { url, status: res.status, statusText: res.statusText, body: data });
    throw new Error((data as any)?.error || (data as any)?.message || "Request failed");
  }

  logInit("register", "REST fallback success", { email: (data as AuthResponse).user?.email });
  return data as AuthResponse;
}

export async function loginViaRest(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const url = "/api/auth/login";
  logInit("login", "REST fallback request", { email: input.email, url, method: "POST" });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  console.log("Login request URL:", url, "status:", res.status, "statusText:", res.statusText);

  const text = await res.text();
  console.log("Raw response:", text);

  let data: AuthResponse | { error?: string; message?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
    console.log("Parsed JSON:", data);
  } catch (err) {
    console.error("JSON parse failed:", err, text);
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    console.error("Login REST request failed:", { url, status: res.status, statusText: res.statusText, body: data });
    throw new Error((data as any)?.error || (data as any)?.message || "Request failed");
  }

  return data as AuthResponse;
}
