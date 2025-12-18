-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "gmailId" TEXT NOT NULL,
    "threadId" TEXT,
    "from" TEXT,
    "to" TEXT,
    "subject" TEXT,
    "date" TIMESTAMP(3),
    "snippet" TEXT,
    "cleanedText" TEXT,
    "rawHash" TEXT,
    "searchVector" tsvector,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessageTag" (
    "emailMessageId" TEXT NOT NULL,
    "emailTagId" TEXT NOT NULL,

    CONSTRAINT "EmailMessageTag_pkey" PRIMARY KEY ("emailMessageId","emailTagId")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "emailMessageId" TEXT NOT NULL,
    "vector" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_gmailId_key" ON "EmailMessage"("gmailId");

-- CreateIndex
CREATE INDEX "EmailMessage_userId_date_idx" ON "EmailMessage"("userId", "date");

-- Full-text search index placeholder (requires tsvector population)
CREATE INDEX "EmailMessage_searchVector_idx" ON "EmailMessage" USING GIN ("searchVector");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTag_name_key" ON "EmailTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_emailMessageId_key" ON "Embedding"("emailMessageId");

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessageTag" ADD CONSTRAINT "EmailMessageTag_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessageTag" ADD CONSTRAINT "EmailMessageTag_emailTagId_fkey" FOREIGN KEY ("emailTagId") REFERENCES "EmailTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
