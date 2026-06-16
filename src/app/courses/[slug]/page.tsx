import { notFound } from "next/navigation";
import Image from "next/image";
import { PlayCircle, Clock, Globe, BarChart, BadgeCheck } from "lucide-react";
import { getCourseBySlug } from "@/lib/queries";
import { getCurrentUser } from "@/lib/rbac";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { BuyButton } from "@/components/buy-button";
import { WishlistButton } from "@/components/wishlist-button";
import { CourseVisitTracker } from "@/components/course-visit-tracker";
import { formatINR, discountedPrice, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  // Is the current user already enrolled?
  const user = await getCurrentUser();
  let enrolled = false;
  if (user) {
    await connectDB();
    enrolled = !!(await Enrollment.exists({ userId: user.id, courseId: course._id }));
  }

  const finalPrice = discountedPrice(course.price, course.discount);

  return (
    <div className="bg-muted/30">
      <CourseVisitTracker courseId={course._id} />

      {/* Header band */}
      <div className="border-b bg-background">
        <div className="container grid gap-8 py-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              {course.targetExam && <Badge>{course.targetExam}</Badge>}
              {course.classLevel && <Badge variant="secondary">{course.classLevel}</Badge>}
              {course.subject && <Badge variant="outline">{course.subject}</Badge>}
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">{course.title}</h1>
            <p className="text-lg text-muted-foreground">{course.shortDescription}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><PlayCircle className="h-4 w-4" /> {course.totalLessons} lessons</span>
              <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> {course.language}</span>
              <span className="flex items-center gap-1"><BarChart className="h-4 w-4" /> {course.enrollmentCount} enrolled</span>
            </div>

            {course.teacher && (
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={course.teacher.avatar ?? undefined} />
                  <AvatarFallback>{course.teacher.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-medium">{course.teacher.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Purchase card */}
          <div className="lg:row-span-2">
            <Card className="sticky top-20 overflow-hidden">
              <div className="relative aspect-video w-full bg-muted">
                {course.thumbnail && (
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                )}
              </div>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{formatINR(finalPrice)}</span>
                  {!!course.discount && (
                    <>
                      <span className="text-muted-foreground line-through">{formatINR(course.price)}</span>
                      <span className="text-sm font-semibold text-green-600">{course.discount}% off</span>
                    </>
                  )}
                </div>
                <BuyButton courseId={course._id} title={course.title} price={finalPrice} enrolled={enrolled} />
                {!enrolled && <WishlistButton courseId={course._id} />}
                <ul className="space-y-2 pt-2 text-sm">
                  <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-secondary" /> Lifetime access</li>
                  <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-secondary" /> Certificate on completion</li>
                  <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-secondary" /> Learn on mobile & desktop</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Body: description + curriculum */}
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="mb-3 text-2xl font-bold">About this course</h2>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: course.description || "<p>No description.</p>" }}
              />
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold">Curriculum</h2>
              <div className="space-y-3">
                {course.curriculum.map((mod, i) => (
                  <div key={mod._id} className="rounded-lg border bg-background">
                    <div className="border-b px-4 py-3 font-semibold">
                      Module {i + 1}: {mod.title}
                    </div>
                    <ul className="divide-y">
                      {mod.lessons.map((lesson) => (
                        <li key={lesson._id} className="flex items-center justify-between px-4 py-2 text-sm">
                          <span className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4 text-muted-foreground" />
                            {lesson.title}
                            {lesson.isPreview && <Badge variant="outline" className="ml-2">Free preview</Badge>}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" /> {formatDuration(lesson.duration)}
                          </span>
                        </li>
                      ))}
                      {!mod.lessons.length && (
                        <li className="px-4 py-2 text-sm text-muted-foreground">No lessons yet.</li>
                      )}
                    </ul>
                  </div>
                ))}
                {!course.curriculum.length && (
                  <p className="text-muted-foreground">Curriculum coming soon.</p>
                )}
              </div>
            </section>

            {course.teacher?.bio && (
              <section>
                <h2 className="mb-3 text-2xl font-bold">About the instructor</h2>
                <p className="text-muted-foreground">{course.teacher.bio}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
