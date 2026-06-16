"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trackEvent } from "@/lib/track";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/** Loads the Razorpay checkout script once. */
function useRazorpayScript() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.Razorpay) return setReady(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);
  return ready;
}

export function BuyButton({
  courseId,
  title,
  price,
  enrolled,
}: {
  courseId: string;
  title: string;
  price: number;
  enrolled: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const ready = useRazorpayScript();
  const [loading, setLoading] = useState(false);

  if (enrolled) {
    return (
      <Button size="lg" className="w-full" onClick={() => router.push(`/dashboard/learn/${courseId}`)}>
        Go to course
      </Button>
    );
  }

  const handleBuy = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/courses`);
      return;
    }
    setLoading(true);
    try {
      await trackEvent("checkout_initiated", { courseId, amount: price });

      // 1. Create a Razorpay order on the server.
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start checkout");

      // 2. Open Razorpay Checkout.
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "GovPath Academy",
        description: title,
        order_id: data.razorpayOrderId,
        prefill: { name: session.user?.name ?? "", email: session.user?.email ?? "" },
        theme: { color: "#f97316" },
        handler: async (response: any) => {
          // 3. Verify the signature server-side, then enroll.
          const verify = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verify.ok) {
            await trackEvent("checkout_completed", { courseId, amount: price });
            toast.success("Payment successful! You are enrolled.");
            router.push(`/dashboard/learn/${courseId}`);
          } else {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => trackEvent("checkout_abandoned", { courseId, amount: price }),
        },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="lg" className="w-full" onClick={handleBuy} disabled={loading || !ready}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
      Buy now
    </Button>
  );
}
