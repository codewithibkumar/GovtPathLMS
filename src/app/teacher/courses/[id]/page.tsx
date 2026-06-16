import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import Course from "@/models/Course";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import { CourseEditor } from "@/components/course-editor";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  await connectDB();
  const course: any = await Course.findById(id).lean();
  if (!course) notFound();
  // Ownership check (admins bypass).
  if (user.role !== "admin" && course.teacherId.toString() !== user.id) redirect("/teacher");

  const modules = await Module.find({ courseId: id }).sort({ order: 1 }).lean();
  const lessons = await Lesson.find({ courseId: id }).sort({ order: 1 }).lean();

  const curriculum = modules.map((m: any) => ({
    _id: m._id.toString(),
    title: m.title,
    order: m.order,
    lessons: lessons
      .filter((l: any) => l.moduleId.toString() === m._id.toString())
      .map((l: any) => ({
        _id: l._id.toString(),
        title: l.title,
        videoKey: l.videoKey,
        duration: l.duration,
        isPreview: l.isPreview,
        order: l.order,
      })),
  }));

  const initial = {
    _id: course._id.toString(),
    title: course.title,
    shortDescription: course.shortDescription ?? "",
    description: course.description ?? "",
    thumbnail: course.thumbnail ?? "",
    price: course.price,
    discount: course.discount ?? 0,
    subject: course.subject ?? "",
    category: course.category ?? "",
    targetExam: course.targetExam ?? "",
    classLevel: course.classLevel ?? "",
    language: course.language ?? "Hindi",
    approvalStatus: course.approvalStatus,
    isPublished: course.isPublished,
    rejectionReason: course.rejectionReason ?? "",
  };

  return <CourseEditor initial={initial} initialCurriculum={curriculum} />;
}
