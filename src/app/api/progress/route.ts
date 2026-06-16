import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/rbac";
import Lesson from "@/models/Lesson";
import Progress from "@/models/Progress";
import Enrollment from "@/models/Enrollment";

/**
 * Upserts per-lesson progress (watch position / completed / notes) and, when a
 * lesson is completed, recomputes the enrollment's overall progress percentage.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { lessonId, watchTime, completed, notes } = await req.json();

    await connectDB();
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    // Must be enrolled in the lesson's course.
    const enrollment = await Enrollment.findOne({ userId: user.id, courseId: lesson.courseId });
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

    const update: Record<string, unknown> = {};
    if (typeof watchTime === "number") update.watchTime = watchTime;
    if (typeof completed === "boolean") update.completed = completed;
    if (typeof notes === "string") update.notes = notes;

    await Progress.findOneAndUpdate(
      { userId: user.id, lessonId },
      { $set: { ...update, courseId: lesson.courseId } },
      { upsert: true, new: true }
    );

    // Recompute course progress when completion state may have changed.
    if (typeof completed === "boolean") {
      const totalLessons = await Lesson.countDocuments({ courseId: lesson.courseId });
      const completedLessons = await Progress.countDocuments({
        userId: user.id,
        courseId: lesson.courseId,
        completed: true,
      });
      const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
      enrollment.progress = pct;
      enrollment.completedAt = pct >= 100 ? enrollment.completedAt ?? new Date() : undefined;
      await enrollment.save();
      return NextResponse.json({ ok: true, progress: pct });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
