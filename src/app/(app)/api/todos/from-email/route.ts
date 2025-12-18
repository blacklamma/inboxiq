import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";

export async function POST() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { message: "Generating tasks from emails is coming soon." },
    { status: 501 }
  );
}
