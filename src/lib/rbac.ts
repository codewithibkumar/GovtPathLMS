import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/models/User";

/** Shape returned to API routes; null when unauthenticated. */
export type SessionUser = { id: string; role: Role; email?: string | null; name?: string | null };

/** Read the current user from the session inside server code / route handlers. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** Throwable guard used by API routes. Returns the user or an HTTP-ish error. */
export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Require an authenticated user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Authentication required");
  return user;
}

/** Require one of the allowed roles. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError(403, "Forbidden");
  return user;
}

/** Teachers may act only on their own resources; admins may act on anything. */
export function canManageCourse(user: SessionUser, teacherId: string) {
  return user.role === "admin" || user.id === teacherId;
}
