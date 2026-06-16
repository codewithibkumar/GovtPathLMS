import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import User from "@/models/User";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import type { CourseCardData } from "@/components/course-card";

/** Ensure ref'd models are registered before populate() runs in server components. */
function ensureModels() {
  void User;
  void Module;
  void Lesson;
}

type Filters = {
  targetExam?: string;
  classLevel?: string;
  subject?: string;
  category?: string;
  teacherId?: string;
  q?: string;
  maxPrice?: number;
};

/** Catalog query: only approved + published courses, newest first. */
export async function getPublishedCourses(filters: Filters = {}): Promise<CourseCardData[]> {
  await connectDB();
  ensureModels();

  const query: Record<string, unknown> = { isPublished: true, approvalStatus: "approved" };
  if (filters.targetExam) query.targetExam = filters.targetExam;
  if (filters.classLevel) query.classLevel = filters.classLevel;
  if (filters.subject) query.subject = filters.subject;
  if (filters.category) query.category = filters.category;
  if (filters.teacherId) query.teacherId = filters.teacherId;
  if (filters.maxPrice) query.price = { $lte: filters.maxPrice };
  if (filters.q) query.$text = { $search: filters.q };

  const courses = await Course.find(query)
    .populate("teacherId", "name")
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

  return courses.map((c: any) => ({
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
}

/** Full course detail with instructor + curriculum (modules -> lessons). */
export async function getCourseBySlug(slug: string) {
  await connectDB();
  ensureModels();

  const course: any = await Course.findOne({ slug }).populate("teacherId", "name bio avatar").lean();
  if (!course) return null;

  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();
  const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 }).lean();

  const curriculum = modules.map((m: any) => ({
    _id: m._id.toString(),
    title: m.title,
    lessons: lessons
      .filter((l: any) => l.moduleId.toString() === m._id.toString())
      .map((l: any) => ({
        _id: l._id.toString(),
        title: l.title,
        duration: l.duration,
        isPreview: l.isPreview,
      })),
  }));

  return {
    _id: course._id.toString(),
    title: course.title,
    slug: course.slug,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnail: course.thumbnail,
    price: course.price,
    discount: course.discount,
    targetExam: course.targetExam,
    classLevel: course.classLevel,
    subject: course.subject,
    language: course.language,
    isPublished: course.isPublished,
    enrollmentCount: course.enrollmentCount,
    ratingAvg: course.ratingAvg,
    teacher: course.teacherId
      ? {
          _id: course.teacherId._id.toString(),
          name: course.teacherId.name,
          bio: course.teacherId.bio,
          avatar: course.teacherId.avatar,
        }
      : null,
    curriculum,
    totalLessons: lessons.length,
  };
}
