"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type MediaResponse = {
  url: string; // signed, short-lived playback URL
  watchTime: number; // resume position (seconds)
  completed: boolean;
  notes: string;
};

export function VideoPlayer({
  lessonId,
  title,
  onCompleted,
}: {
  lessonId: string;
  title: string;
  onCompleted?: (lessonId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [data, setData] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastSaved = useRef(0);

  // Fetch a fresh signed URL + saved progress whenever the lesson changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/media/${lessonId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Access denied");
        return r.json();
      })
      .then((d: MediaResponse) => {
        if (!active) return;
        setData(d);
        setNotes(d.notes || "");
        setCompleted(d.completed);
      })
      .catch(() => active && toast.error("Could not load this lesson"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [lessonId]);

  // Resume playback once the signed URL + saved position are known.
  useEffect(() => {
    if (data && videoRef.current && data.watchTime > 5) {
      videoRef.current.currentTime = data.watchTime;
    }
  }, [data]);

  const persist = useCallback(
    async (body: Record<string, unknown>) => {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ lessonId, ...body }),
      });
    },
    [lessonId]
  );

  // Throttled save of the current position (every ~15s of playback).
  const handleTimeUpdate = () => {
    const t = videoRef.current?.currentTime ?? 0;
    if (t - lastSaved.current > 15) {
      lastSaved.current = t;
      persist({ watchTime: Math.floor(t) });
    }
  };

  const markComplete = async () => {
    setSaving(true);
    await persist({ completed: true, watchTime: Math.floor(videoRef.current?.currentTime ?? 0) });
    setCompleted(true);
    setSaving(false);
    onCompleted?.(lessonId);
    toast.success("Lesson marked complete");
  };

  const saveNotes = async () => {
    setSaving(true);
    await persist({ notes });
    setSaving(false);
    toast.success("Notes saved");
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {loading ? (
          <div className="flex h-full items-center justify-center text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : data?.url ? (
          <video
            ref={videoRef}
            src={data.url}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            onTimeUpdate={handleTimeUpdate}
            onEnded={markComplete}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/70">
            Video not available
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button onClick={markComplete} disabled={completed || saving} variant={completed ? "secondary" : "default"}>
          <CheckCircle2 className="h-4 w-4" />
          {completed ? "Completed" : "Mark complete"}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">My notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down formulas, doubts, timestamps…"
          rows={4}
        />
        <Button variant="outline" size="sm" onClick={saveNotes} disabled={saving}>
          <Save className="h-4 w-4" /> Save notes
        </Button>
      </div>
    </div>
  );
}
