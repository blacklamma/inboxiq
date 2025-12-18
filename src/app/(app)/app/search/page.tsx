import { SearchClient } from "./search-client";

export default function SearchPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Search
        </h1>
        <p className="text-sm text-slate-600">
          Hybrid keyword + semantic search. Use filters to narrow down.
        </p>
      </div>
      <SearchClient />
    </div>
  );
}
