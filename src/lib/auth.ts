import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { Role } from "@/models/User";

export const authOptions: NextAuthOptions = {
  // JWT sessions so role is available in middleware (edge) without a DB hit.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        await connectDB();
        // password has select:false, so explicitly request it.
        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select(
          "+password"
        );
        if (!user || !user.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        if (!user.isActive) throw new Error("Account disabled");
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role as Role,
        };
      },
    }),
    // Only enabled when Google credentials are configured.
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    // Upsert Google users into our collection (default role: student).
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      await connectDB();
      const existing = await User.findOne({ email: user.email?.toLowerCase() });
      if (!existing) {
        await User.create({
          name: user.name,
          email: user.email?.toLowerCase(),
          avatar: user.image,
          provider: "google",
          role: "student",
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      // On first sign-in `user` is set. For Google, look up the role/id we stored.
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: Role }).role ?? "student";
      }
      if (!token.role && token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role as Role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
