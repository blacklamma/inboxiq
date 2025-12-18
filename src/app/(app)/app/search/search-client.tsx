"use client";

import { useEffect, useState } from "react";

type SearchFilters = {
  sender?: string;
  tag?: string;
  from?: string;
  to?: string;
};

type Result = {
  message: {
    id: string;
    subject: string | null;
    from: string | null;
    date: string | null;
    cleanedText: string | null;
    snippet: string | null;
    tags: { tag: { id: string; name: string } }[];
  };
  reasons: string[];
};

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? // @ts-expect-error vendor-prefixed
        window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  useEffect(() => {
    if (SpeechRecognition) setSpeechSupported(true);
  }, [SpeechRecognition]);

  async function handleSearch(e?: React.FormEvent, overrideText?: string) {
    e?.preventDefault();
    const text = (overrideText ?? query).trim();
    if (!text) return;
    if (!overrideText) setQuery(text);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, ...filters }),
      });
      if (!res.ok) {
        setError("Search failed");
        return;
      }
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function startListening() {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onerror = () => {
      setListening(false);
      setError("Speech recognition error");
    };
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: {
      results: SpeechRecognitionResultList;
    }) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) {
        setQuery(transcript);
      }
      const last = event.results[event.results.length - 1];
      if (last?.isFinal && transcript) {
        void handleSearch(undefined, transcript);
      }
    };

    recognition.start();
  }

  function toggleListening() {
    if (!speechSupported) return;
    if (listening) {
      setListening(false);
    } else {
      startListening();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-900">
            Describe the email you&apos;re looking for…
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-4 text-base text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            rows={3}
            placeholder="e.g., invoices from last month about AWS charges"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            value={filters.sender ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sender: e.target.value }))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Sender"
          />
          <input
            type="text"
            value={filters.tag ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Tag"
          />
          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, from: e.target.value }))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="From date"
          />
          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="To date"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            onClick={toggleListening}
            disabled={!speechSupported}
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            {speechSupported
              ? listening
                ? "Stop voice"
                : "Start voice"
              : "Voice unsupported"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {results.length === 0 && !loading ? (
          <div className="text-sm text-slate-600">No results yet.</div>
        ) : (
          results.map((result) => (
            <div
              key={result.message.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {result.message.subject ?? "(No subject)"}
                  </div>
                  <div className="truncate text-xs text-slate-600">
                    {result.message.from ?? "Unknown sender"}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {result.message.date
                    ? new Date(result.message.date).toLocaleDateString()
                    : ""}
                </div>
              </div>
              <div className="mt-2 line-clamp-2 text-xs text-slate-700">
                {result.message.cleanedText ?? result.message.snippet ?? ""}
              </div>
              {result.message.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.message.tags.map((t) => (
                    <span
                      key={t.tag.id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
              {result.reasons?.length ? (
                <div className="mt-2 text-xs text-slate-500">
                  Why this matched: {result.reasons.join("; ")}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
