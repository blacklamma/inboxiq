import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TOTALS = [100, 500, 1000];

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const total = typeof body?.total === "number" ? body.total : null;

  if (!ALLOWED_TOTALS.includes(total ?? 0)) {
    return NextResponse.json(
      { error: "Invalid total, must be one of 100, 500, 1000" },
      { status: 400 }
    );
  }

  const job = await prisma.indexJob.create({
    data: {
      userId: session.user.id,
      status: "QUEUED",
      total,
      processed: 0,
    },
  });

  return NextResponse.json(job);
}
