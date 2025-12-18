-- AlterTable
ALTER TABLE "ConnectedAccount" ALTER COLUMN "scopes" DROP DEFAULT,
ALTER COLUMN "scopes" TYPE TEXT USING array_to_string("scopes", ' '),
ALTER COLUMN "scopes" SET NOT NULL,
ALTER COLUMN "scopes" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_userId_provider_key" ON "ConnectedAccount"("userId", "provider");
