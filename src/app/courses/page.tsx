import { Suspense } from "react";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";
import { getPublishedCourses } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  // Next.js 15: searchParams is a Promise.
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const courses = await getPublishedCourses({
    targetExam: sp.targetExam,
    classLevel: sp.classLevel,
    subject: sp.subject,
    category: sp.category,
    q: sp.q,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
  });

  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">Course catalog</h1>
        <p className="text-muted-foreground">Find the right course for your exam and class.</p>
      </div>

      <Suspense>
        <CourseFilters />
      </Suspense>

      <p className="text-sm text-muted-foreground">{courses.length} course(s) found</p>

      {courses.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No courses match your filters.
        </p>
      )}
    </div>
  );
}
