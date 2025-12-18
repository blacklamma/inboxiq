/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const defaultTags = ["Primary", "Updates", "Promotions"];

  await Promise.all(
    defaultTags.map((name) =>
      prisma.emailTag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  console.log("Seeded default tags:", defaultTags.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
