import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireRole, AuthError } from "@/lib/rbac";
import { getSignedUploadUrl, publicUrl } from "@/lib/s3";

/**
 * Returns a presigned PUT URL so the browser can upload a video/thumbnail
 * directly to R2 (keeps large files off the Next.js server). Teachers & admins
 * only. The caller PUTs the file to `uploadUrl`, then stores `key` on the lesson
 * (videos) or the public URL on the course (thumbnails).
 */
export async function POST(req: Request) {
  try {
    await requireRole("teacher", "admin");
    const { filename, contentType, kind } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    const safeName = filename.replace(/[^\w.\-]/g, "_");
    const folder = kind === "thumbnail" ? "thumbnails" : "videos";
    const key = `${folder}/${randomUUID()}-${safeName}`;

    const uploadUrl = await getSignedUploadUrl(key, contentType);

    return NextResponse.json({
      uploadUrl,
      key,
      // For thumbnails we expose the public URL to store on the course.
      publicUrl: kind === "thumbnail" ? publicUrl(key) : null,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 });
  }
}
