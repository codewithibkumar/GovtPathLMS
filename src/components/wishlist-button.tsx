"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WishlistButton({
  courseId,
  initial = false,
}: {
  courseId: string;
  initial?: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (res.status === 401) {
      toast.error("Please log in to save courses");
    } else if (res.ok) {
      const d = await res.json();
      setSaved(d.saved);
    }
    setLoading(false);
  };

  return (
    <Button variant="outline" size="lg" className="w-full" onClick={toggle} disabled={loading}>
      <Heart className={cn("h-4 w-4", saved && "fill-red-500 text-red-500")} />
      {saved ? "Saved to wishlist" : "Add to wishlist"}
    </Button>
  );
}
