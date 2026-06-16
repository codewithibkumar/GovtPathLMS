"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Role } from "@/models/User";

type Row = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export function UsersManager({ initial, currentUserId }: { initial: Row[]; currentUserId: string }) {
  const [users, setUsers] = useState<Row[]>(initial);
  const [filter, setFilter] = useState("");

  async function patch(id: string, body: Partial<{ role: Role; isActive: boolean }>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Update failed");
    setUsers((p) => p.map((u) => (u._id === id ? { ...u, ...body } : u)));
    toast.success("User updated");
  }

  const visible = users.filter(
    (u) => u.name.toLowerCase().includes(filter.toLowerCase()) || u.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <input
          className="h-10 w-full max-w-sm rounded-md border bg-background px-3 text-sm"
          placeholder="Search by name or email…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const isSelf = u._id === currentUserId;
                return (
                  <tr key={u._id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <Select
                        value={u.role}
                        onValueChange={(v) => patch(u._id, { role: v as Role })}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Badge variant={u.isActive ? "success" : "destructive"}>
                        {u.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.createdAt}</td>
                    <td className="p-3 text-right">
                      {!isSelf && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => patch(u._id, { isActive: !u.isActive })}
                        >
                          {u.isActive ? "Disable" : "Enable"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
