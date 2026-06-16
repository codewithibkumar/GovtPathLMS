import Link from "next/link";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { Plus, IndianRupee, BookOpen, Users } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import Course from "@/models/Course";
import Order from "@/models/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  draft: "secondary",
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  await connectDB();

  const courses: any[] = await Course.find({ teacherId: user.id }).sort({ createdAt: -1 }).lean();
  const courseIds = courses.map((c) => c._id);

  // Earnings: sum of paid orders for this teacher's courses.
  const earningsAgg = await Order.aggregate([
    { $match: { status: "paid", courseId: { $in: courseIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: null, total: { $sum: "$amount" }, sales: { $sum: 1 } } },
  ]);
  const earnings = earningsAgg[0]?.total ?? 0;
  const sales = earningsAgg[0]?.sales ?? 0;
  const totalStudents = courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0);

  return (
    <div className="container space-y-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and track earnings.</p>
        </div>
        <Button asChild>
          <Link href="/teacher/courses/new"><Plus className="h-4 w-4" /> New course</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total earnings" value={formatINR(earnings)} icon={<IndianRupee className="h-5 w-5" />} />
        <Stat label="Courses" value={courses.length} icon={<BookOpen className="h-5 w-5" />} />
        <Stat label="Students" value={totalStudents} icon={<Users className="h-5 w-5" />} />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">My courses</h2>
        <Card>
          <CardContent className="p-0">
            {courses.length ? (
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="p-3">Course</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c._id.toString()} className="border-b last:border-0">
                      <td className="p-3 font-medium">{c.title}</td>
                      <td className="p-3">{formatINR(c.price)}</td>
                      <td className="p-3">{c.enrollmentCount || 0}</td>
                      <td className="p-3">
                        <Badge variant={statusVariant[c.approvalStatus] ?? "secondary"}>
                          {c.isPublished ? "published" : c.approvalStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/teacher/courses/${c._id}`}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-muted-foreground">No courses yet. Create your first one!</p>
                <Button asChild><Link href="/teacher/courses/new"><Plus className="h-4 w-4" /> New course</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <p className="text-sm text-muted-foreground">
        Lifetime sales: <strong>{sales}</strong>
      </p>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-primary">{icon}</span>
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}
