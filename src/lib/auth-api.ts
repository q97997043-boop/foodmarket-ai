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

  if (!res.ok) {
    throw new Error(await readJsonError(res));
  }

  const data = (await res.json()) as AuthResponse;
  logInit("register", "REST fallback success", { email: data.user.email });
  return data;
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

  if (!res.ok) {
    throw new Error(await readJsonError(res));
  }

  return res.json() as Promise<AuthResponse>;
}
