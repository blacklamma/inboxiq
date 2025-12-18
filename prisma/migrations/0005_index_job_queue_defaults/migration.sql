-- Update existing rows to queued if they were not started
UPDATE "IndexJob" SET "status" = 'QUEUED' WHERE "status" = 'NOT_STARTED';

-- Set default to queued
ALTER TABLE "IndexJob" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
