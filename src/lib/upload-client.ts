/** Browser helper: get a presigned URL then PUT the file straight to R2. */
export async function uploadToR2(
  file: File,
  kind: "thumbnail" | "video",
  onProgress?: (pct: number) => void
): Promise<{ key: string; publicUrl: string | null }> {
  // 1. Ask the server for a presigned PUT URL.
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, kind }),
  });
  if (!res.ok) throw new Error("Could not get upload URL");
  const { uploadUrl, key, publicUrl } = await res.json();

  // 2. Upload with XHR so we can report progress.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });

  return { key, publicUrl };
}

/** Reads a video file's duration (seconds) in the browser. */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration) || 0);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}
