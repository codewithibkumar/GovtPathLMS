import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/rbac";
import User from "@/models/User";

/** Admin: list all users (optionally filtered by role / search). */
export async function GET(req: Request) {
  try {
    await requireRole("admin");
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const q = searchParams.get("q");

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (q) filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json(users.map((u: any) => ({ ...u, _id: u._id.toString() })));
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
