"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Survey } from "@/lib/types";
import { Icon } from "./Icons";

export function SurveyList({
  surveys,
  onChange,
}: {
  surveys: Survey[];
  onChange: () => void;
}) {
  const router = useRouter();
  async function toggle(s: Survey) {
    await api.status(s.id, s.status === "published" ? "unpublish" : "publish");
    onChange();
  }
  async function remove(s: Survey) {
    if (
      !confirm(
        `Delete “${s.title}” and all its responses? This cannot be undone.`,
      )
    )
      return;
    await api.remove(s.id);
    onChange();
  }
  async function copy(s: Survey) {
    const url = `${location.origin}/survey/${s.slug}`;
    await navigator.clipboard.writeText(url);
    alert("Public link copied.");
  }
  if (!surveys.length)
    return (
      <div className="card py-16 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon name="survey" />
        </div>
        <h3 className="font-semibold">No surveys yet</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create your first survey to start collecting responses.
        </p>
        <Link href="/admin/surveys/new" className="btn btn-primary mt-5">
          <Icon name="plus" />
          Create survey
        </Link>
      </div>
    );
  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[2fr_110px_110px_140px_190px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <span>Survey</span>
        <span>Status</span>
        <span>Responses</span>
        <span>Updated</span>
        <span>Actions</span>
      </div>
      {surveys.map((s) => (
        <div
          key={s.id}
          className="grid gap-4 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[2fr_110px_110px_140px_190px] md:items-center"
        >
          <div>
            <Link
              className="font-semibold hover:text-indigo-600"
              href={`/admin/surveys/${s.id}/edit`}
            >
              {s.title}
            </Link>
            <div className="mt-1 text-xs text-slate-400">/{s.slug}</div>
          </div>
          <div>
            <button
              onClick={() => toggle(s)}
              title={s.status === "published" ? "Unpublish survey" : "Publish survey"}
              aria-label={s.status === "published" ? "Unpublish survey" : "Publish survey"}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
            >
              {s.status === "published" ? "Published" : "Draft"}
            </button>
          </div>
          <span className="text-sm text-slate-600">
            {s.response_count ?? 0}
          </span>
          <span className="text-sm text-slate-500">
            {new Date(s.updated_at).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push(`/admin/surveys/${s.id}/edit`)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Edit"
              title="Edit"
            >
              <Icon name="edit" />
            </button>
            <button
              onClick={() => window.open(`/survey/${s.slug}`, "_blank")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Preview"
              title="Preview"
            >
              <Icon name="eye" />
            </button>
            <button
              onClick={() => copy(s)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Copy public link"
              title="Copy public link"
            >
              <Icon name="copy" />
            </button>
            <Link
              href={`/admin/surveys/${s.id}/analytics`}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Analytics"
              title="View analytics"
            >
              <Icon name="chart" />
            </Link>
            <button
              onClick={() => remove(s)}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete"
              title="Delete"
            >
              <Icon name="trash" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
