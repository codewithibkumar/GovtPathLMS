import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole, canManageCourse, AuthError } from "@/lib/rbac";
import Course from "@/models/Course";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";

// Fields a teacher/admin may edit. Publish/approval is handled by admin routes.
const EDITABLE = [
  "title",
  "shortDescription",
  "description",
  "thumbnail",
  "price",
  "discount",
  "category",
  "subject",
  "targetExam",
  "classLevel",
  "language",
  "tags",
] as const;

async function loadAndAuthorize(id: string) {
  const user = await requireRole("teacher", "admin");
  await connectDB();
  const course = await Course.findById(id);
  if (!course) throw new AuthError(404, "Course not found");
  if (!canManageCourse(user, course.teacherId.toString())) {
    throw new AuthError(403, "You can only manage your own courses");
  }
  return { user, course };
}

/** Full course + curriculum for the editor. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { course } = await loadAndAuthorize(id);
    const modules = await Module.find({ courseId: id }).sort({ order: 1 }).lean();
    const lessons = await Lesson.find({ courseId: id }).sort({ order: 1 }).lean();
    return NextResponse.json({
      course: { ...course.toObject(), _id: course._id.toString() },
      modules: modules.map((m: any) => ({ ...m, _id: m._id.toString() })),
      lessons: lessons.map((l: any) => ({ ...l, _id: l._id.toString() })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** Update course metadata. Editing resets an approved course to pending review. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { course } = await loadAndAuthorize(id);
    const body = await req.json();

    for (const key of EDITABLE) {
      if (key in body) (course as any)[key] = body[key];
    }
    // Re-submitting for approval (teacher action).
    if (body.submitForReview) {
      course.approvalStatus = "pending";
    }
    await course.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** Delete a course and its curriculum. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await loadAndAuthorize(id);
    await Promise.all([
      Course.findByIdAndDelete(id),
      Module.deleteMany({ courseId: id }),
      Lesson.deleteMany({ courseId: id }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
