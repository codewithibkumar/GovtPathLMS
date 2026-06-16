import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import User from "@/models/User";
import Course from "@/models/Course";
import { CourseCard } from "@/components/course-card";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();
  void Course;
  const me: any = await User.findById(user.id)
    .populate({ path: "wishlist", populate: { path: "teacherId", select: "name" } })
    .lean();

  const courses = (me?.wishlist ?? []).map((c: any) => ({
    _id: c._id.toString(),
    title: c.title,
    slug: c.slug,
    thumbnail: c.thumbnail,
    price: c.price,
    discount: c.discount,
    targetExam: c.targetExam,
    classLevel: c.classLevel,
    teacherName: c.teacherId?.name,
    enrollmentCount: c.enrollmentCount,
    ratingAvg: c.ratingAvg,
  }));

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-3xl font-bold">My wishlist</h1>
      {courses.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c: any) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Your wishlist is empty. Browse the catalog and tap the heart to save courses.
        </p>
      )}
    </div>
  );
}
