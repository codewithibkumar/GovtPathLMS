import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

// Diagnostic endpoint: hit /api/health to confirm the DB connection.
// Returns the underlying error message (no credentials) so deploy issues are
// visible without digging through container logs.
export const dynamic = "force-dynamic";

export async function GET() {
  const hasUri = !!process.env.MONGODB_URI;
  try {
    await connectDB();
    return NextResponse.json({ status: "ok", db: "connected", hasMongoUri: hasUri });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        db: "failed",
        hasMongoUri: hasUri,
        // e.g. "querySrv ENOTFOUND", "bad auth", "Missing MONGODB_URI..."
        message: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
