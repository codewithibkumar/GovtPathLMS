import { connectDB } from "@/lib/db";
import AnalyticsEvent from "@/models/AnalyticsEvent";
import Order from "@/models/Order";
import Course from "@/models/Course";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";

/** Aggregated metrics for the admin analytics dashboard. */
export async function getAnalyticsSummary() {
  await connectDB();

  const [
    visits,
    checkoutsInitiated,
    checkoutsCompleted,
    checkoutsAbandoned,
    revenueAgg,
    studentCount,
    teacherCount,
    courseCount,
    pendingCount,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({ type: "course_visited" }),
    AnalyticsEvent.countDocuments({ type: "checkout_initiated" }),
    AnalyticsEvent.countDocuments({ type: "checkout_completed" }),
    AnalyticsEvent.countDocuments({ type: "checkout_abandoned" }),
    Order.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
    Course.countDocuments({}),
    Course.countDocuments({ approvalStatus: "pending" }),
  ]);

  const revenue = revenueAgg[0]?.total ?? 0;
  const paidOrders = revenueAgg[0]?.count ?? 0;
  const conversionRate = visits ? Math.round((checkoutsCompleted / visits) * 1000) / 10 : 0;

  // Top courses by enrollment.
  const topCoursesRaw = await Course.find({})
    .sort({ enrollmentCount: -1 })
    .limit(5)
    .select("title enrollmentCount price")
    .lean();
  const topCourses = topCoursesRaw.map((c: any) => ({
    _id: c._id.toString(),
    title: c.title,
    enrollmentCount: c.enrollmentCount,
    price: c.price,
  }));

  // Revenue over the last 7 days for a sparkline.
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);
  const dailyRaw = await Order.aggregate([
    { $match: { status: "paid", createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const daily = dailyRaw.map((d: any) => ({ date: d._id, revenue: d.revenue }));

  const totalEnrollments = await Enrollment.countDocuments({});

  return {
    visits,
    funnel: {
      visited: visits,
      initiated: checkoutsInitiated,
      completed: checkoutsCompleted,
      abandoned: checkoutsAbandoned,
    },
    revenue,
    paidOrders,
    conversionRate,
    studentCount,
    teacherCount,
    courseCount,
    pendingCount,
    totalEnrollments,
    topCourses,
    daily,
  };
}
