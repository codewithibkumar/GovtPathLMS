import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/rbac";
import User, { ROLES } from "@/models/User";

/** Admin: change a user's role (e.g. promote student -> teacher) or toggle active. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole("admin");
    const { id } = await params;
    const { role, isActive } = await req.json();

    await connectDB();

    const update: Record<string, unknown> = {};
    if (role) {
      if (!ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      // Guard: an admin cannot demote themselves (avoids locking out the platform).
      if (id === admin.id && role !== "admin") {
        return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
      }
      update.role = role;
    }
    if (typeof isActive === "boolean") update.isActive = isActive;

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ ...user.toObject(), _id: user._id.toString() });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
