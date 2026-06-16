import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Lazily-constructed Razorpay client. The constructor throws if the key is
 * missing, so we build it on first use (request time) rather than at import —
 * keeping `next build` (which evaluates route modules) from crashing.
 */
let _razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
  }
  return _razorpay;
}

/** Server-side Razorpay client proxy. Never expose the key secret to the browser. */
export const razorpay = {
  orders: {
    create: (options: {
      amount: number;
      currency: string;
      receipt?: string;
      notes?: Record<string, string>;
    }) => getRazorpay().orders.create(options),
  },
};

/**
 * Verify the signature returned by Razorpay Checkout after a successful payment.
 * signature == HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}

/** Verify the X-Razorpay-Signature header on incoming webhooks. */
export function verifyWebhookSignature(body: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
    .update(body)
    .digest("hex");
  return safeEqual(expected, signature);
}

/** Constant-time comparison to avoid timing attacks. */
function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
