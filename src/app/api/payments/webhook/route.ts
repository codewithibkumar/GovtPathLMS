import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfillOrder } from "@/lib/fulfill";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

// Razorpay sends JSON; we must read the RAW body to verify the signature.
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — the authoritative payment confirmation. Configure the URL
 * (https://<domain>/api/payments/webhook) and secret in the Razorpay dashboard,
 * subscribing to payment.captured and payment.failed.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);

  try {
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      await fulfillOrder(payment.order_id, payment.id);
    } else if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      await connectDB();
      await Order.findOneAndUpdate({ razorpayOrderId: payment.order_id }, { status: "failed" });
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("webhook error", err);
    // Return 200 anyway for handled-but-noop cases; 500 makes Razorpay retry.
    return NextResponse.json({ error: "processing error" }, { status: 500 });
  }
}
