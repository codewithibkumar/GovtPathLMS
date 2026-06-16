import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { requireUser, AuthError } from "@/lib/rbac";
import { fulfillOrder } from "@/lib/fulfill";

/**
 * Called by the browser after Razorpay Checkout succeeds. Verifies the HMAC
 * signature, then fulfils the order (enrollment). The webhook is the source of
 * truth; this just gives the user instant access.
 */
export async function POST(req: Request) {
  try {
    await requireUser();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    const valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await fulfillOrder(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("verify error", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
