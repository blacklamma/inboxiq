"use client";

import { useEffect, useState } from "react";

type IndexJobResponse = {
  id: string;
  status: string;
  total: number;
  processed: number;
  lastError?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

const TOTAL_OPTIONS = [100, 500, 1000] as const;

export function IndexClient({
  initialJob,
}: {
  initialJob: IndexJobResponse | null;
}) {
  const [selectedTotal, setSelectedTotal] = useState<
    (typeof TOTAL_OPTIONS)[number]
  >(TOTAL_OPTIONS[0]);
  const [job, setJob] = useState<IndexJobResponse | null>(initialJob);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchLatest() {
    try {
      const res = await fetch("/api/index-jobs/latest", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as IndexJobResponse | null;
      setJob(data);
    } catch {
      // ignore polling errors
    }
  }

  async function handleStart() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/index-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total: selectedTotal }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Failed to create job");
        return;
      }
      const data = (await res.json()) as IndexJobResponse;
      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Select how many emails to index
            </h2>
            <p className="text-sm text-slate-600">
              Choose a batch size and start a new indexing job.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStart}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Starting…" : "Start indexing"}
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {TOTAL_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedTotal(option)}
              className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition ${
                selectedTotal === option
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              {option.toLocaleString()} emails
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-3 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Latest indexing job
            </h3>
            <p className="text-sm text-slate-600">
              Polling every few seconds for updates.
            </p>
          </div>
          <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Auto-refresh
          </span>
        </div>

        {job ? (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">Status</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-800 uppercase">
                {job.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Progress</span>
              <span className="font-semibold text-slate-900">
                {job.processed} / {job.total}
              </span>
            </div>
            {job.lastError ? (
              <div className="rounded-md bg-rose-50 px-3 py-2 text-rose-800">
                Last error: {job.lastError}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No jobs yet. Start a new indexing job to see progress here.
          </div>
        )}
      </div>
    </div>
  );
}
