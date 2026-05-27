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

async function createRestaurantForUser(userId: string) {
  const legacyId = await nextLegacyRestaurantId();
  const slug = `restaurant-${legacyId}`;

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Demo Restaurant",
      slug,
      legacyId,
      tvSettings: { create: {} },
    },
  });

  await seedRestaurantDefaults(restaurant.id);
  await prisma.user.update({
    where: { id: userId },
    data: { restaurantId: restaurant.id },
  });

  return restaurant;
}

export async function ensureRestaurantForUser(
  userId: string,
  restaurantId: string | null,
) {
  if (!restaurantId) {
    logApi("auth-service", "ensuring restaurant for user", {
      userId,
      restaurantId: null,
    });
    return createRestaurantForUser(userId);
  }

  let restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    logApi("auth-service", "restaurant missing for user, creating default", {
      userId,
      restaurantId,
    });
    return createRestaurantForUser(userId);
  }

  if (!restaurant.legacyId) {
    restaurant = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { legacyId: await nextLegacyRestaurantId() },
    });
  }

  await seedRestaurantDefaults(restaurant.id);
  return restaurant;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  try {
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
  } catch (err) {
    console.error("REGISTER SERVICE ERROR", err);
    if ((err as any)?.code) {
      console.error("PRISMA ERROR", err);
    }
    throw err;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  try {
    logApi("auth-service", "login start", { email: input.email });
    console.log("LOGIN SERVICE INPUT", { email: input.email, passwordSet: input.password.length > 0 });
    console.log("JWT_SECRET SET", Boolean(env.JWT_SECRET));

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

    const restaurant = await ensureRestaurantForUser(user.id, user.restaurantId);
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!updatedUser) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "User not found after login",
      });
    }

    const token = jwt.sign(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        restaurantId: updatedUser.restaurantId,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    logApi("auth-service", "login complete", {
      email: user.email,
      restaurantId: updatedUser.restaurantId,
    });

    return {
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        restaurantId: updatedUser.restaurantId,
      },
    };
  } catch (err) {
    console.error("LOGIN SERVICE ERROR", err);
    try {
      console.error((err as any)?.stack ?? String(err));
    } catch (e) {
      /* ignore */
    }
    if ((err as any)?.code) {
      console.error("PRISMA ERROR", err);
    }
    throw err;
  }
}
