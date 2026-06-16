import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/rbac";
import User from "@/models/User";

/** Toggle a course in the current user's wishlist. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { courseId } = await req.json();

    await connectDB();
    const doc = await User.findById(user.id).select("wishlist");
    const has = doc.wishlist?.some((id: any) => id.toString() === courseId);

    if (has) {
      doc.wishlist = doc.wishlist.filter((id: any) => id.toString() !== courseId);
    } else {
      doc.wishlist.push(courseId);
    }
    await doc.save();

    return NextResponse.json({ saved: !has });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
