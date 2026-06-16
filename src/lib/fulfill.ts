import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import AnalyticsEvent from "@/models/AnalyticsEvent";

/**
 * Idempotently fulfils a paid order: flip status -> paid, create the enrollment,
 * bump the course's enrollment counter, and log a checkout_completed event.
 * Safe to call from BOTH the client-verify route and the webhook.
 */
export async function fulfillOrder(
  razorpayOrderId: string,
  razorpayPaymentId?: string,
  razorpaySignature?: string
) {
  await connectDB();
  const order = await Order.findOne({ razorpayOrderId });
  if (!order) throw new Error("Order not found");

  // Already fulfilled — nothing to do (handles webhook + client race).
  if (order.status === "paid") return order;

  order.status = "paid";
  if (razorpayPaymentId) order.razorpayPaymentId = razorpayPaymentId;
  if (razorpaySignature) order.razorpaySignature = razorpaySignature;
  await order.save();

  // Create enrollment only if it doesn't exist (unique index also guards this).
  const existing = await Enrollment.findOne({ userId: order.userId, courseId: order.courseId });
  if (!existing) {
    await Enrollment.create({
      userId: order.userId,
      courseId: order.courseId,
      orderId: order._id,
      certificateId: `GPA-${randomUUID().slice(0, 8).toUpperCase()}`,
    });
    await Course.findByIdAndUpdate(order.courseId, { $inc: { enrollmentCount: 1 } });
  }

  await AnalyticsEvent.create({
    type: "checkout_completed",
    userId: order.userId,
    courseId: order.courseId,
    orderId: order._id,
    amount: order.amount,
  });

  return order;
}
