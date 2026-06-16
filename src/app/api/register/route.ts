import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  // Self-service signup can never create an admin.
  role: z.enum(["student", "teacher"]).default("student"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { name, email, password, role } = parsed.data;

    await connectDB();
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role,
      provider: "credentials",
    });

    return NextResponse.json(
      { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
