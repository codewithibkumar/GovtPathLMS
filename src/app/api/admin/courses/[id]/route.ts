import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/rbac";
import Course from "@/models/Course";

/**
 * Admin moderation: approve & publish, reject (with reason), or unpublish a
 * teacher-submitted course.
 *   action: "approve" | "reject" | "unpublish"
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await params;
    const { action, reason } = await req.json();

    await connectDB();
    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    switch (action) {
      case "approve":
        course.approvalStatus = "approved";
        course.isPublished = true;
        course.rejectionReason = undefined;
        break;
      case "reject":
        course.approvalStatus = "rejected";
        course.isPublished = false;
        course.rejectionReason = reason || "Did not meet quality guidelines";
        break;
      case "unpublish":
        course.isPublished = false;
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    await course.save();
    return NextResponse.json({ ok: true, approvalStatus: course.approvalStatus, isPublished: course.isPublished });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
