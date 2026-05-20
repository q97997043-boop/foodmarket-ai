import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { prisma } from "../prisma-client";
import { env } from "./env";
import { seedRestaurantDefaults } from "./seed";
import { nextLegacyRestaurantId } from "./ids";
import { logApi } from "./log";

export type RegisterInput = {
  email: string;
  password: string;
  restaurantName?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    restaurantId: string | null;
  };
};

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `restaurant-${nanoid(6)}`
  );
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  logApi("auth-service", "register start", { email: input.email });

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    logApi("auth-service", "register conflict", { email: input.email });
    throw new TRPCError({
      code: "CONFLICT",
      message: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  logApi("auth-service", "password hashed");

  const restaurantName =
    input.restaurantName ?? `${input.email.split("@")[0]}'s Kitchen`;
  const baseSlug = slugify(restaurantName);

  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const legacyId = await nextLegacyRestaurantId();
  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurantName,
      slug,
      legacyId,
      tvSettings: { create: {} },
    },
  });
  logApi("auth-service", "restaurant created", {
    id: restaurant.id,
    legacyId: restaurant.legacyId,
  });

  await seedRestaurantDefaults(restaurant.id);
  logApi("auth-service", "defaults seeded");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: hashedPassword,
      role: "OWNER",
      restaurantId: restaurant.id,
    },
  });
  logApi("auth-service", "user inserted", { userId: user.id });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );
  logApi("auth-service", "jwt issued");

  const result: AuthResult = {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    },
  };

  logApi("auth-service", "register complete", { email: user.email });
  return result;
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  logApi("auth-service", "login start", { email: input.email });

  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
    });
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  logApi("auth-service", "login complete", { email: user.email });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    },
  };
}
