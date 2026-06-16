import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { getSignedPlaybackUrl } from "@/lib/s3";
import Lesson from "@/models/Lesson";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Progress from "@/models/Progress";

/**
 * Mints a short-lived signed playback URL for a lesson video — but only after
 * verifying access:
 *   - preview lessons are open to anyone
 *   - otherwise the user must be enrolled, OR be the course's teacher, OR admin
 * Also returns the saved resume position + notes for the player.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  await connectDB();

  const lesson = await Lesson.findById(lessonId);
  if (!lesson || !lesson.videoKey) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const user = await getCurrentUser();

  let allowed = lesson.isPreview;
  let watchTime = 0;
  let completed = false;
  let notes = "";

  if (!allowed && user) {
    if (user.role === "admin") {
      allowed = true;
    } else {
      const course = await Course.findById(lesson.courseId).select("teacherId");
      if (course && course.teacherId.toString() === user.id) {
        allowed = true; // teacher previewing their own course
      } else {
        const enrolled = await Enrollment.exists({ userId: user.id, courseId: lesson.courseId });
        allowed = !!enrolled;
      }
    }

    if (allowed) {
      const p = await Progress.findOne({ userId: user.id, lessonId });
      if (p) {
        watchTime = p.watchTime;
        completed = p.completed;
        notes = p.notes;
      }
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: "Purchase required" }, { status: 403 });
  }

  const url = await getSignedPlaybackUrl(lesson.videoKey);
  return NextResponse.json({ url, watchTime, completed, notes });
}
