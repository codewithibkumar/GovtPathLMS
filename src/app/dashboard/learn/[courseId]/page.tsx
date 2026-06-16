import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import Course from "@/models/Course";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import Enrollment from "@/models/Enrollment";
import Progress from "@/models/Progress";
import { CoursePlayer } from "@/components/course-player";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();

  // Access gate: must be enrolled (admins/owning teacher bypass for preview).
  const course: any = await Course.findById(courseId).lean();
  if (!course) notFound();

  const isOwner = course.teacherId.toString() === user.id;
  const enrolled = await Enrollment.exists({ userId: user.id, courseId });
  if (!enrolled && user.role !== "admin" && !isOwner) {
    redirect(`/courses/${course.slug}`);
  }

  const modules = await Module.find({ courseId }).sort({ order: 1 }).lean();
  const lessons = await Lesson.find({ courseId }).sort({ order: 1 }).lean();
  const progressDocs = await Progress.find({ userId: user.id, courseId, completed: true })
    .select("lessonId")
    .lean();

  const curriculum = modules.map((m: any) => ({
    _id: m._id.toString(),
    title: m.title,
    lessons: lessons
      .filter((l: any) => l.moduleId.toString() === m._id.toString())
      .map((l: any) => ({ _id: l._id.toString(), title: l.title, duration: l.duration })),
  }));

  const completed = progressDocs.map((p: any) => p.lessonId.toString());

  return (
    <CoursePlayer courseTitle={course.title} curriculum={curriculum} initialCompleted={completed} />
  );
}
