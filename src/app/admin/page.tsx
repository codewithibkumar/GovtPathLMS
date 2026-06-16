import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, BookOpen, IndianRupee, BarChart3, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/rbac";
import { getAnalyticsSummary } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const a = await getAnalyticsSummary();

  return (
    <div className="container space-y-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="text-muted-foreground">Platform overview at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/users">Users</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/courses">Courses</Link></Button>
          <Button asChild><Link href="/admin/analytics">Analytics</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={formatINR(a.revenue)} icon={<IndianRupee className="h-5 w-5" />} />
        <Stat label="Students" value={a.studentCount} icon={<Users className="h-5 w-5" />} />
        <Stat label="Teachers" value={a.teacherCount} icon={<Users className="h-5 w-5" />} />
        <Stat label="Courses" value={a.courseCount} icon={<BookOpen className="h-5 w-5" />} />
        <Stat label="Course visits" value={a.visits} icon={<BarChart3 className="h-5 w-5" />} />
        <Stat label="Conversions" value={`${a.conversionRate}%`} icon={<BarChart3 className="h-5 w-5" />} />
        <Stat label="Enrollments" value={a.totalEnrollments} icon={<BookOpen className="h-5 w-5" />} />
        <Stat label="Pending approval" value={a.pendingCount} icon={<Clock className="h-5 w-5" />} highlight={a.pendingCount > 0} />
      </div>

      {a.pendingCount > 0 && (
        <Card className="border-amber-400">
          <CardContent className="flex items-center justify-between p-4">
            <p>{a.pendingCount} course(s) awaiting your review.</p>
            <Button asChild size="sm"><Link href="/admin/courses?status=pending">Review now</Link></Button>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Top courses</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="p-3">Course</th><th className="p-3">Enrollments</th><th className="p-3">Price</th></tr>
              </thead>
              <tbody>
                {a.topCourses.map((c) => (
                  <tr key={c._id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{c.title}</td>
                    <td className="p-3">{c.enrollmentCount}</td>
                    <td className="p-3">{formatINR(c.price)}</td>
                  </tr>
                ))}
                {!a.topCourses.length && <tr><td className="p-3 text-muted-foreground" colSpan={3}>No data yet.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value, icon, highlight }: { label: string; value: React.ReactNode; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-amber-400" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-primary">{icon}</span>
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}
