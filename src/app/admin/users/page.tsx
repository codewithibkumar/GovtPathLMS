import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import User from "@/models/User";
import { UsersManager } from "@/components/users-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/dashboard");

  await connectDB();
  const users: any[] = await User.find({}).select("-password").sort({ createdAt: -1 }).limit(200).lean();

  const initial = users.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: new Date(u.createdAt).toLocaleDateString("en-IN"),
  }));

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-3xl font-bold">User management</h1>
      <UsersManager initial={initial} currentUserId={me.id} />
    </div>
  );
}
