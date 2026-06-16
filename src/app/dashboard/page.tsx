import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BookOpen, Award } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Order from "@/models/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();
  void Course; // ensure registered for populate

  const enrollments: any[] = await Enrollment.find({ userId: user.id })
    .populate("courseId", "title slug thumbnail")
    .sort({ createdAt: -1 })
    .lean();

  const orders: any[] = await Order.find({ userId: user.id, status: "paid" })
    .populate("courseId", "title")
    .sort({ createdAt: -1 })
    .lean();

  const completed = enrollments.filter((e) => e.progress >= 100).length;

  return (
    <div className="container space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold">Hi, {user.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground">Pick up where you left off.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Enrolled courses" value={enrollments.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Completed" value={completed} icon={<Award className="h-5 w-5" />} />
        <StatCard label="Total spent" value={formatINR(orders.reduce((s, o) => s + o.amount, 0))} icon={<span>₹</span>} />
      </div>

      {/* Enrolled courses */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">My courses</h2>
        {enrollments.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => (
              <Card key={e._id.toString()} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {e.courseId?.thumbnail && (
                    <Image src={e.courseId.thumbnail} alt={e.courseId.title} fill className="object-cover" />
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <h3 className="line-clamp-1 font-semibold">{e.courseId?.title}</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{e.progress}% complete</span>
                      {e.progress >= 100 && <Badge variant="success">Done</Badge>}
                    </div>
                    <Progress value={e.progress} />
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1" size="sm">
                      <Link href={`/dashboard/learn/${e.courseId?._id}`}>
                        {e.progress > 0 ? "Resume" : "Start"}
                      </Link>
                    </Button>
                    {e.progress >= 100 && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/certificate/${e._id}`}>Certificate</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">You haven&apos;t enrolled in any course yet.</p>
              <Button asChild><Link href="/courses">Browse courses</Link></Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Purchases */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">My purchases</h2>
        <Card>
          <CardContent className="p-0">
            {orders.length ? (
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="p-3">Course</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id.toString()} className="border-b last:border-0">
                      <td className="p-3">{o.courseId?.title ?? "—"}</td>
                      <td className="p-3">{formatINR(o.amount)}</td>
                      <td className="p-3">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-center text-muted-foreground">No purchases yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-primary">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
