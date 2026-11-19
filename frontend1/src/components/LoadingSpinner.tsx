export function LoadingSpinner({ label = "Loading…", fullPage = false }: { label?: string; fullPage?: boolean }) {
  return <div className={`flex items-center justify-center ${fullPage ? "min-h-screen" : "min-h-64"}`} role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-3 text-sm font-medium text-slate-500">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" aria-hidden />
      <span>{label}</span>
    </div>
  </div>;
}
