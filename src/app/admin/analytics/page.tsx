import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { getAnalyticsSummary } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const a = await getAnalyticsSummary();
  const maxRevenue = Math.max(1, ...a.daily.map((d) => d.revenue));
  const funnel = [
    { label: "Visited", value: a.funnel.visited, color: "bg-blue-500" },
    { label: "Checkout started", value: a.funnel.initiated, color: "bg-amber-500" },
    { label: "Completed", value: a.funnel.completed, color: "bg-green-600" },
    { label: "Abandoned", value: a.funnel.abandoned, color: "bg-red-500" },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  return (
    <div className="container space-y-8 py-10">
      <h1 className="text-3xl font-bold">Analytics & CRM</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="Total revenue" value={formatINR(a.revenue)} />
        <Metric label="Paid orders" value={a.paidOrders} />
        <Metric label="Visit→buy rate" value={`${a.conversionRate}%`} />
        <Metric label="Abandoned carts" value={a.funnel.abandoned} />
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader><CardTitle>Conversion funnel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {funnel.map((f) => (
            <div key={f.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{f.label}</span>
                <span className="font-medium">{f.value}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${f.color}`} style={{ width: `${(f.value / funnelMax) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Daily revenue */}
      <Card>
        <CardHeader><CardTitle>Revenue — last 7 days</CardTitle></CardHeader>
        <CardContent>
          {a.daily.length ? (
            <div className="flex h-48 items-end gap-3">
              {a.daily.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-primary"
                      style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                      title={formatINR(d.revenue)}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No revenue in the last 7 days.</p>
          )}
        </CardContent>
      </Card>

      {/* Top courses */}
      <Card>
        <CardHeader><CardTitle>Top courses by enrollment</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr><th className="p-3">Course</th><th className="p-3">Enrollments</th><th className="p-3">Est. revenue</th></tr>
            </thead>
            <tbody>
              {a.topCourses.map((c) => (
                <tr key={c._id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{c.title}</td>
                  <td className="p-3">{c.enrollmentCount}</td>
                  <td className="p-3">{formatINR(c.enrollmentCount * c.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
