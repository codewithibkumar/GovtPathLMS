import type { Role } from "@/models/User";
import "next-auth";
import "next-auth/jwt";

// Augment NextAuth's types so `session.user.role` and `session.user.id` are typed.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
