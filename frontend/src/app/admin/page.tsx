"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Dashboard } from "@/lib/types";
import { Icon } from "@/components/Icons";
import { SurveyList } from "@/components/SurveyList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-indigo-600">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight">Good to see you</h1>
          <p className="mt-2 text-slate-500">
            Here&apos;s how your surveys are performing.
          </p>
        </div>
        <Link href="/admin/surveys/new" className="btn btn-primary">
          <Icon name="plus" />
          Create survey
        </Link>
      </div>
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}{" "}
          <button onClick={load} className="ml-2 underline">
            Try again
          </button>
        </div>
      )}
      {!data ? (
        <LoadingSpinner label="Loading dashboard…" />
      ) : (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {[
              [
                "Total surveys",
                data.total_surveys,
                "survey",
                "bg-indigo-50 text-indigo-600",
              ],
              [
                "Published",
                data.active_surveys,
                "check",
                "bg-emerald-50 text-emerald-600",
              ],
              [
                "Total responses",
                data.total_responses,
                "chart",
                "bg-violet-50 text-violet-600",
              ],
            ].map(([label, value, icon, color]) => (
              <div
                className="card flex items-center gap-4 p-5"
                key={String(label)}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}
                >
                  <Icon name={String(icon)} />
                </span>
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent surveys</h2>
            <Link
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              href="/admin/surveys"
            >
              View all
            </Link>
          </div>
          <SurveyList surveys={data.recent_surveys} onChange={load} />
        </>
      )}
    </>
  );
}
