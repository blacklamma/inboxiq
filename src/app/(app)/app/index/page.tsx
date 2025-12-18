import { IndexClient } from "./index-client";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function IndexPage() {
  const session = await getServerAuthSession();
  const latestJob = session?.user?.id
    ? await prisma.indexJob.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const initialJob = latestJob ? JSON.parse(JSON.stringify(latestJob)) : null;

  return <IndexClient initialJob={initialJob} />;
}
