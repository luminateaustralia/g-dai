"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { APP_ROLES, type AppRole } from "@/db/schema";
import { ROLE_COOKIE } from "./session";

export async function setActiveRole(role: AppRole) {
  if (!(APP_ROLES as readonly string[]).includes(role)) {
    throw new Error("Unknown role.");
  }
  const store = await cookies();
  store.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
}
