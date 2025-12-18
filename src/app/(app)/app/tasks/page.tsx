export default function TasksPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Tasks from emails
        </h1>
        <p className="text-sm text-slate-600">
          Coming soon: generate actionable tasks and calendar items from your
          inbox.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Generate tasks from selected emails
            </div>
            <div className="text-sm text-slate-600">
              This will use AI to summarize and create todos and calendar
              events.
            </div>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-300 px-4 text-sm font-medium text-white opacity-60"
          >
            Coming soon
          </button>
        </div>
      </div>
    </div>
  );
}
