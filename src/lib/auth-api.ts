import { logInit } from "./init-log";
import type { User } from "../providers/AuthProvider";

export type AuthResponse = {
  token: string;
  user: User;
};

async function readJsonError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.error?.message === "string") return data.error.message;
    if (typeof data?.message === "string") return data.message;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

/** REST fallback when tRPC network fails */
export async function registerViaRest(input: {
  email: string;
  password: string;
  restaurantName?: string;
}): Promise<AuthResponse> {
  logInit("register", "REST fallback request", { email: input.email });

  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  if (!text) {
    console.error("Empty API response for registerViaRest", { status: res.status, statusText: res.statusText });
    throw new Error("Empty API response");
  }

  let data: AuthResponse | { error?: string };
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON response for registerViaRest:", text, err);
    throw new Error("Invalid JSON from API");
  }

  if (!res.ok) {
    console.error("Register REST request failed:", { status: res.status, statusText: res.statusText, body: data });
    throw new Error((data as any)?.error || "Request failed");
  }

  logInit("register", "REST fallback success", { email: (data as AuthResponse).user?.email });
  return data as AuthResponse;
}

export async function loginViaRest(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  if (!text) {
    console.error("Empty API response for loginViaRest", { status: res.status, statusText: res.statusText });
    throw new Error("Empty API response");
  }

  let data: AuthResponse | { error?: string };
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON response for loginViaRest:", text, err);
    throw new Error("Invalid JSON from API");
  }

  if (!res.ok) {
    console.error("Login REST request failed:", { status: res.status, statusText: res.statusText, body: data });
    throw new Error((data as any)?.error || "Request failed");
  }

  return data as AuthResponse;
}
