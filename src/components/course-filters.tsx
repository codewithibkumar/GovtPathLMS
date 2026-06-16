"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TARGET_EXAMS, CLASS_LEVELS } from "@/models/Course";

const ALL = "__all__";

/** URL-driven filter bar for the course catalog. */
export function CourseFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    router.push(`/courses?${next.toString()}`);
  };

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={params.get("q") ?? ""}
          placeholder="Search courses…"
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value);
          }}
        />
      </div>

      <Select value={params.get("targetExam") ?? ALL} onValueChange={(v) => setParam("targetExam", v)}>
        <SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All exams</SelectItem>
          {TARGET_EXAMS.map((e) => (
            <SelectItem key={e} value={e}>{e}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get("classLevel") ?? ALL} onValueChange={(v) => setParam("classLevel", v)}>
        <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All classes</SelectItem>
          {CLASS_LEVELS.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get("maxPrice") ?? ALL} onValueChange={(v) => setParam("maxPrice", v)}>
        <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any price</SelectItem>
          <SelectItem value="0">Free</SelectItem>
          <SelectItem value="499">Under ₹499</SelectItem>
          <SelectItem value="999">Under ₹999</SelectItem>
          <SelectItem value="2999">Under ₹2,999</SelectItem>
        </SelectContent>
      </Select>

      {params.toString() && (
        <Button variant="ghost" className="lg:col-span-4" onClick={() => router.push("/courses")}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
