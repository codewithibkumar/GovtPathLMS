import Link from "next/link";
import Image from "next/image";
import { Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINR, discountedPrice } from "@/lib/utils";

export type CourseCardData = {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  price: number;
  discount?: number;
  targetExam?: string;
  classLevel?: string;
  teacherName?: string;
  enrollmentCount?: number;
  ratingAvg?: number;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  const finalPrice = discountedPrice(course.price, course.discount);
  const hasDiscount = (course.discount ?? 0) > 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No thumbnail
          </div>
        )}
        {course.targetExam && (
          <Badge className="absolute left-3 top-3">{course.targetExam}</Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
          {course.title}
        </h3>
        {course.teacherName && (
          <p className="text-sm text-muted-foreground">by {course.teacherName}</p>
        )}

        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
          {course.classLevel && <span>{course.classLevel}</span>}
          {typeof course.enrollmentCount === "number" && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {course.enrollmentCount}
            </span>
          )}
          {course.ratingAvg ? (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {course.ratingAvg.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold">{formatINR(finalPrice)}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatINR(course.price)}
              </span>
              <span className="text-xs font-semibold text-green-600">
                {course.discount}% off
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
