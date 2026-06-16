"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

/** Fires a `course_visited` analytics event once when the detail page mounts. */
export function CourseVisitTracker({ courseId }: { courseId: string }) {
  useEffect(() => {
    trackEvent("course_visited", { courseId });
  }, [courseId]);
  return null;
}
