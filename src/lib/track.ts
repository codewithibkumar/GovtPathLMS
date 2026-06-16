/** Client-side analytics helper. Fires funnel events to /api/tracking. */
import type { EventType } from "@/models/AnalyticsEvent";

/** Stable anonymous visitor id stored in localStorage. */
export function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("gp_sid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("gp_sid", id);
  }
  return id;
}

export async function trackEvent(
  type: EventType,
  payload: { courseId?: string; orderId?: string; amount?: number; meta?: Record<string, unknown> } = {}
) {
  try {
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // keepalive lets the event flush even as the page navigates away.
      keepalive: true,
      body: JSON.stringify({
        type,
        sessionId: getSessionId(),
        ...payload,
        meta: { referrer: document.referrer, path: location.pathname, ...payload.meta },
      }),
    });
  } catch {
    // analytics must never break the UX
  }
}
