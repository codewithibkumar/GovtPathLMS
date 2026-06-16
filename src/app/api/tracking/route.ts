import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AnalyticsEvent, { EVENT_TYPES } from "@/models/AnalyticsEvent";
import { getCurrentUser } from "@/lib/rbac";

/**
 * Records a funnel event. Accepts both anonymous (sessionId only) and
 * authenticated events. Never throws to the client — analytics is best-effort.
 */
export async function POST(req: Request) {
  try {
    const { type, courseId, orderId, amount, sessionId, meta } = await req.json();
    if (!EVENT_TYPES.includes(type)) {
      return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
    }

    await connectDB();
    const user = await getCurrentUser();

    await AnalyticsEvent.create({
      type,
      userId: user?.id,
      courseId: courseId || undefined,
      orderId: orderId || undefined,
      amount,
      sessionId,
      meta,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Swallow errors so a failed event never disrupts the UI.
    return NextResponse.json({ ok: false });
  }
}
