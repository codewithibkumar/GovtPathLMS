import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import User from "@/models/User";
import { Certificate } from "@/components/certificate";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();
  void Course;
  void User;

  const enrollment: any = await Enrollment.findById(enrollmentId)
    .populate("courseId", "title")
    .populate("userId", "name")
    .lean();

  if (!enrollment) notFound();
  // Only the owner may view their certificate.
  if (enrollment.userId._id.toString() !== user.id) redirect("/dashboard");
  // Gate on completion.
  if (enrollment.progress < 100) redirect("/dashboard");

  return (
    <Certificate
      studentName={enrollment.userId.name}
      courseTitle={enrollment.courseId.title}
      certificateId={enrollment.certificateId ?? enrollmentId.slice(-8).toUpperCase()}
      date={new Date(enrollment.completedAt ?? enrollment.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    />
  );
}
