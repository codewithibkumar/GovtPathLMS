import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/rbac";
import Course from "@/models/Course";
import { slugify } from "@/lib/utils";

/** Create a new course (teacher or admin). Starts as a draft, unpublished. */
export async function POST(req: Request) {
  try {
    const user = await requireRole("teacher", "admin");
    const body = await req.json();

    await connectDB();

    // Build a unique slug from the title.
    let slug = slugify(body.title || "course");
    let n = 1;
    while (await Course.exists({ slug })) slug = `${slugify(body.title)}-${++n}`;

    const course = await Course.create({
      title: body.title,
      slug,
      shortDescription: body.shortDescription,
      description: body.description,
      thumbnail: body.thumbnail,
      price: body.price ?? 0,
      discount: body.discount ?? 0,
      category: body.category,
      subject: body.subject,
      targetExam: body.targetExam,
      classLevel: body.classLevel,
      language: body.language || "Hindi",
      tags: body.tags || [],
      teacherId: user.id, // teachers always own what they create
      approvalStatus: "draft",
      isPublished: false,
    });

    return NextResponse.json({ id: course._id.toString(), slug: course.slug }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("create course error", err);
    return NextResponse.json({ error: "Could not create course" }, { status: 500 });
  }
}

/** List courses for management. Teachers see their own; admins see all. */
export async function GET() {
  try {
    const user = await requireRole("teacher", "admin");
    await connectDB();
    const filter = user.role === "admin" ? {} : { teacherId: user.id };
    const courses = await Course.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      courses.map((c: any) => ({ ...c, _id: c._id.toString(), teacherId: c.teacherId.toString() }))
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
