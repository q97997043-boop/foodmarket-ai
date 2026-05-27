import { logInit } from "./init-log";
import type { User } from "../providers/AuthProvider";

export type AuthResponse = {
  token: string;
  user: User;
  restaurantId: string | null;
};

function getApiBase() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

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
  const url = `${getApiBase()}/api/auth/register`;
  logInit("register", "REST fallback request", { email: input.email, url, method: "POST" });
  console.log("registerViaRest: request url", url);
  console.log("registerViaRest: request body", input);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  console.log("registerViaRest: response status", { status: res.status, statusText: res.statusText });

  const text = await res.text();
  console.log("registerViaRest: raw response text:", text);

  let data: AuthResponse | { error?: string; message?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
    console.log("registerViaRest: parsed JSON:", data);
  } catch (err) {
    console.error("registerViaRest: JSON parse failed:", err, text);
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    console.error("Register REST request failed:", { url, status: res.status, statusText: res.statusText, body: data });
    throw new Error((data as any)?.error || (data as any)?.message || "Request failed");
  }

  logInit("register", "REST fallback success", { email: (data as AuthResponse).user?.email });
  return {
    token: (data as any).token,
    user: (data as any).user,
    restaurantId: (data as any).restaurantId ?? (data as any).user?.restaurantId ?? null,
  } as AuthResponse;
}

export async function loginViaRest(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const url = `${getApiBase()}/api/auth/login`;
  logInit("login", "REST fallback request", { email: input.email, url, method: "POST" });
  console.log("loginViaRest: request url", url);
  console.log("loginViaRest: request body", input);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  console.log("loginViaRest: response status", { status: res.status, statusText: res.statusText });

  const text = await res.text();
  console.log("loginViaRest: raw response text:", text);

  let data: AuthResponse | { error?: string; message?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
    console.log("loginViaRest: parsed JSON:", data);
  } catch (err) {
    console.error("loginViaRest: JSON parse failed:", err, text);
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    console.error("Login REST request failed:", { url, status: res.status, statusText: res.statusText, body: data });
    throw new Error((data as any)?.error || (data as any)?.message || "Request failed");
  }

  const asAny = data as any;
  if (!asAny || asAny.success !== true) {
    console.error("loginViaRest: unexpected response shape (missing success=true)", data);
    throw new Error("Unexpected response from server");
  }

  if (!asAny.token || !asAny.user) {
    console.error("loginViaRest: missing token or user in response", data);
    throw new Error("Invalid auth response from server");
  }

  console.log("loginViaRest: success - token & user received", { token: asAny.token, user: asAny.user, restaurantId: asAny.restaurantId });
  return {
    token: asAny.token,
    user: asAny.user,
    restaurantId: asAny.restaurantId ?? asAny.user?.restaurantId ?? null,
  } as AuthResponse;
}
