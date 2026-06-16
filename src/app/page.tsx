import Link from "next/link";
import { ArrowRight, BadgeCheck, PlayCircle, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { getPublishedCourses } from "@/lib/queries";
import { TARGET_EXAMS } from "@/models/Course";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm">
              <BadgeCheck className="h-4 w-4 text-secondary" /> Trusted by 50,000+ aspirants
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Crack <span className="text-primary">SSC, Banking, UPSC</span> & Board Exams
            </h1>
            <p className="text-lg text-muted-foreground">
              Structured online courses for Class 9–12 students and graduates preparing for
              India&apos;s toughest government exams. Learn from expert mentors, at your own pace.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Explore courses <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Start free</Link>
              </Button>
            </div>
            <div className="flex gap-8 pt-4 text-sm">
              <Stat icon={<Users className="h-5 w-5 text-primary" />} value="50k+" label="Students" />
              <Stat icon={<PlayCircle className="h-5 w-5 text-primary" />} value="1,200+" label="Lessons" />
              <Stat icon={<Trophy className="h-5 w-5 text-primary" />} value="98%" label="Satisfaction" />
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl border bg-card p-2 shadow-xl">
              <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <PlayCircle className="h-20 w-20 text-primary/70" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam categories */}
      <section className="container py-12">
        <h2 className="mb-6 text-2xl font-bold">Prepare by exam</h2>
        <div className="flex flex-wrap gap-3">
          {TARGET_EXAMS.map((exam) => (
            <Link
              key={exam}
              href={`/courses?targetExam=${encodeURIComponent(exam)}`}
              className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              {exam}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="container pb-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Popular courses</h2>
          <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {courses.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.slice(0, 8).map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            No published courses yet. Run the seed script or publish one from the admin dashboard.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="font-bold">{value}</div>
        <div className="text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
