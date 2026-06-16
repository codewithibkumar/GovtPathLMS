"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";

type Row = {
  _id: string;
  title: string;
  slug: string;
  teacherName: string;
  price: number;
  approvalStatus: string;
  isPublished: boolean;
};

const variant: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  draft: "secondary",
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export function CoursesModerator({ initial }: { initial: Row[] }) {
  const [courses, setCourses] = useState<Row[]>(initial);

  async function moderate(id: string, action: "approve" | "reject" | "unpublish") {
    let reason: string | undefined;
    if (action === "reject") {
      reason = prompt("Reason for rejection?") || undefined;
      if (reason === undefined) return;
    }
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed");
    setCourses((p) =>
      p.map((c) =>
        c._id === id ? { ...c, approvalStatus: data.approvalStatus, isPublished: data.isPublished } : c
      )
    );
    toast.success("Course updated");
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">Course</th>
              <th className="p-3">Teacher</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id} className="border-b last:border-0">
                <td className="p-3 font-medium">
                  <Link href={`/courses/${c.slug}`} className="hover:text-primary hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{c.teacherName}</td>
                <td className="p-3">{formatINR(c.price)}</td>
                <td className="p-3">
                  <Badge variant={variant[c.approvalStatus] ?? "secondary"}>
                    {c.isPublished ? "published" : c.approvalStatus}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    {!c.isPublished && (
                      <Button size="sm" onClick={() => moderate(c._id, "approve")}>Approve</Button>
                    )}
                    {c.approvalStatus !== "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => moderate(c._id, "reject")}>Reject</Button>
                    )}
                    {c.isPublished && (
                      <Button size="sm" variant="outline" onClick={() => moderate(c._id, "unpublish")}>Unpublish</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!courses.length && (
              <tr><td className="p-6 text-center text-muted-foreground" colSpan={5}>No courses.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
