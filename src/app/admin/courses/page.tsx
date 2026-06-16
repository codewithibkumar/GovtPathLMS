import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import Course from "@/models/Course";
import User from "@/models/User";
import { CoursesModerator } from "@/components/courses-moderator";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/dashboard");

  const { status } = await searchParams;

  await connectDB();
  void User;
  const filter = status ? { approvalStatus: status } : {};
  const courses: any[] = await Course.find(filter)
    .populate("teacherId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const initial = courses.map((c) => ({
    _id: c._id.toString(),
    title: c.title,
    slug: c.slug,
    teacherName: c.teacherId?.name ?? "—",
    price: c.price,
    approvalStatus: c.approvalStatus,
    isPublished: c.isPublished,
  }));

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-3xl font-bold">Course moderation</h1>
      <CoursesModerator initial={initial} />
    </div>
  );
}
