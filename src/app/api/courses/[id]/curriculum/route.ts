import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireRole, canManageCourse, AuthError } from "@/lib/rbac";
import Course from "@/models/Course";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";

type IncomingLesson = {
  _id?: string;
  title: string;
  videoKey?: string;
  duration?: number;
  isPreview?: boolean;
  order: number;
};
type IncomingModule = {
  _id?: string;
  title: string;
  order: number;
  lessons: IncomingLesson[];
};

/**
 * Replaces the course curriculum with the posted tree. Existing modules/lessons
 * are matched by _id and updated (preserving lesson ids so student Progress
 * stays valid); missing ones are deleted; new ones are created.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireRole("teacher", "admin");
    await connectDB();

    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    if (!canManageCourse(user, course.teacherId.toString())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { modules }: { modules: IncomingModule[] } = await req.json();

    const keepModuleIds: string[] = [];
    const keepLessonIds: string[] = [];

    for (const mod of modules) {
      const moduleId = mod._id && mongoose.isValidObjectId(mod._id)
        ? new mongoose.Types.ObjectId(mod._id)
        : new mongoose.Types.ObjectId();
      keepModuleIds.push(moduleId.toString());

      await Module.findByIdAndUpdate(
        moduleId,
        { _id: moduleId, courseId: id, title: mod.title, order: mod.order },
        { upsert: true }
      );

      for (const lesson of mod.lessons) {
        const lessonId = lesson._id && mongoose.isValidObjectId(lesson._id)
          ? new mongoose.Types.ObjectId(lesson._id)
          : new mongoose.Types.ObjectId();
        keepLessonIds.push(lessonId.toString());

        await Lesson.findByIdAndUpdate(
          lessonId,
          {
            _id: lessonId,
            courseId: id,
            moduleId,
            title: lesson.title,
            videoKey: lesson.videoKey,
            duration: lesson.duration ?? 0,
            isPreview: !!lesson.isPreview,
            order: lesson.order,
          },
          { upsert: true }
        );
      }
    }

    // Prune removed items.
    await Module.deleteMany({ courseId: id, _id: { $nin: keepModuleIds } });
    await Lesson.deleteMany({ courseId: id, _id: { $nin: keepLessonIds } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("curriculum error", err);
    return NextResponse.json({ error: "Failed to save curriculum" }, { status: 500 });
  }
}
