-- Add new enum value. Applied in its own migration so the new value is committed
-- before being referenced elsewhere.
ALTER TYPE "IndexJobStatus" ADD VALUE IF NOT EXISTS 'QUEUED';
