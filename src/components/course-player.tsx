"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronLeft, PlayCircle } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";
import { Progress } from "@/components/ui/progress";
import { cn, formatDuration } from "@/lib/utils";

type Lesson = { _id: string; title: string; duration: number };
type Module = { _id: string; title: string; lessons: Lesson[] };

export function CoursePlayer({
  courseTitle,
  curriculum,
  initialCompleted,
}: {
  courseTitle: string;
  curriculum: Module[];
  initialCompleted: string[];
}) {
  const allLessons = curriculum.flatMap((m) => m.lessons);
  const [activeId, setActiveId] = useState(allLessons[0]?._id);
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompleted));

  const active = allLessons.find((l) => l._id === activeId);
  const pct = allLessons.length ? Math.round((completed.size / allLessons.length) * 100) : 0;

  const markDone = (id: string) => setCompleted((prev) => new Set(prev).add(id));

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_360px]">
      {/* Player */}
      <div className="p-4 lg:p-8">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        {active ? (
          <VideoPlayer key={active._id} lessonId={active._id} title={active.title} onCompleted={markDone} />
        ) : (
          <p className="text-muted-foreground">This course has no lessons yet.</p>
        )}
      </div>

      {/* Curriculum sidebar */}
      <aside className="border-t bg-muted/30 lg:border-l lg:border-t-0">
        <div className="space-y-2 border-b p-4">
          <h2 className="font-semibold">{courseTitle}</h2>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{completed.size}/{allLessons.length} lessons</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {curriculum.map((mod, i) => (
            <div key={mod._id}>
              <div className="bg-background/60 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                Module {i + 1}: {mod.title}
              </div>
              <ul>
                {mod.lessons.map((lesson) => {
                  const isActive = lesson._id === activeId;
                  const done = completed.has(lesson._id);
                  return (
                    <li key={lesson._id}>
                      <button
                        onClick={() => setActiveId(lesson._id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
                          isActive && "bg-accent"
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        ) : isActive ? (
                          <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1 line-clamp-2">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">{formatDuration(lesson.duration)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
