import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { razorpay } from "@/lib/razorpay";
import { requireUser, AuthError } from "@/lib/rbac";
import Course from "@/models/Course";
import Order from "@/models/Order";
import Enrollment from "@/models/Enrollment";
import AnalyticsEvent from "@/models/AnalyticsEvent";
import { discountedPrice } from "@/lib/utils";

/** Creates a Razorpay order for a course and records a local Order (status=created). */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { courseId } = await req.json();

    await connectDB();
    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return NextResponse.json({ error: "Course not available" }, { status: 404 });
    }

    // Block double purchase.
    const already = await Enrollment.exists({ userId: user.id, courseId });
    if (already) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    const amountInr = discountedPrice(course.price, course.discount);
    // Razorpay works in paise.
    const rzpOrder = await razorpay.orders.create({
      amount: amountInr * 100,
      currency: "INR",
      receipt: `course_${courseId}_${user.id}`.slice(0, 40),
      notes: { courseId, userId: user.id },
    });

    await Order.create({
      userId: user.id,
      courseId,
      razorpayOrderId: rzpOrder.id,
      amount: amountInr,
      status: "created",
    });

    await AnalyticsEvent.create({
      type: "checkout_initiated",
      userId: user.id,
      courseId,
      amount: amountInr,
    });

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("order error", err);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }
}
