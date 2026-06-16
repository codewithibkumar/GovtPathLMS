"use client";

import { GraduationCap, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A printable completion certificate. "Download" triggers the browser print
 *  dialog (Save as PDF) — no extra dependency needed. */
export function Certificate({
  studentName,
  courseTitle,
  certificateId,
  date,
}: {
  studentName: string;
  courseTitle: string;
  certificateId: string;
  date: string;
}) {
  return (
    <div className="container py-10">
      <div className="mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Download / Print
        </Button>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border-8 border-double border-primary/60 bg-white p-12 text-center text-slate-800 shadow-lg print:border-primary">
        <GraduationCap className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-3xl font-extrabold tracking-wide text-primary">GovPath Academy</h1>
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-slate-500">Certificate of Completion</p>
        <p className="mt-8 text-lg">This is proudly presented to</p>
        <p className="mt-2 text-4xl font-bold">{studentName}</p>
        <p className="mt-6 text-lg">for successfully completing the course</p>
        <p className="mt-2 text-2xl font-semibold text-secondary">{courseTitle}</p>

        <div className="mt-12 flex items-center justify-between text-sm text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">{date}</p>
            <p>Date of completion</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">{certificateId}</p>
            <p>Certificate ID</p>
          </div>
        </div>
      </div>
    </div>
  );
}
