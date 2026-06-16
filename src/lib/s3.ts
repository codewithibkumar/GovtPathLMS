import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 is S3-compatible, so we use the AWS S3 SDK pointed at the R2
 * endpoint. Videos live in a PRIVATE bucket and are served only via short-lived
 * signed URLs minted per request (see /api/media/[lessonId]).
 */
const endpoint = process.env.R2_ENDPOINT;
const bucket = process.env.R2_BUCKET || "govpath-media";

export const s3 = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

/** Signed URL the browser can GET to stream a private video (default 2h). */
export async function getSignedPlaybackUrl(key: string, expiresIn = 60 * 60 * 2) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

/** Signed URL the browser can PUT to, for direct-to-R2 uploads (default 1h). */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 60 * 60
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/** Public URL for thumbnails stored in a public R2 bucket / custom domain. */
export function publicUrl(key: string) {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";
  return `${base}/${key}`;
}
