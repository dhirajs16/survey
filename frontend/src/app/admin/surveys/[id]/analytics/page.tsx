"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Analytics } from "@/lib/types";
import { Icon } from "@/components/Icons";
import { LoadingSpinner } from "@/components/LoadingSpinner";
export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .analytics(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);
  if (error)
    return <div className="rounded-xl bg-red-50 p-5 text-red-700">{error}</div>;
  if (!data) return <LoadingSpinner label="Loading analytics…" />;
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="mb-3 inline-block text-sm font-medium text-slate-500 hover:text-indigo-600"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold">{data.survey.title}</h1>
          <p className="mt-2 text-slate-500">
            Response analytics and answer breakdown.
          </p>
        </div>
        <a
          target="_blank"
          href={`/survey/${data.survey.slug}`}
          className="btn btn-secondary"
        >
          <Icon name="eye" />
          Open survey
        </a>
      </div>
      <div className="card mb-7 flex items-center gap-4 p-6">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon name="chart" />
        </span>
        <div>
          <p className="text-sm text-slate-500">Total responses</p>
          <p className="text-3xl font-bold">{data.total_responses}</p>
        </div>
      </div>
      {data.total_responses === 0 ? (
        <div className="card py-16 text-center">
          <h2 className="text-lg font-bold">No responses yet</h2>
          <p className="mt-2 text-slate-500">
            Share the public survey link to start collecting feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.questions.map((q, i) => (
            <section key={q.id} className="card p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Question {i + 1} · {q.type.replace("_", " ")}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">{q.text}</h2>
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">
                  {q.answered} answered
                </span>
              </div>
              {q.options && (
                <div className="space-y-4">
                  {q.options.map((o) => (
                    <div key={o.option}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span>{o.option}</span>
                        <span className="font-semibold">
                          {o.count}{" "}
                          <span className="font-normal text-slate-400">
                            ({o.percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${o.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {q.ratings && (
                <>
                  <p className="mb-4 text-sm text-slate-500">
                    Average rating{" "}
                    <strong className="text-2xl text-slate-900">
                      {q.average ?? "—"}
                    </strong>{" "}
                    / 5
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {q.ratings.map((r) => (
                      <div
                        key={r.rating}
                        className="rounded-xl bg-slate-50 p-3 text-center"
                      >
                        <div className="text-xs text-slate-500">
                          {r.rating} star
                        </div>
                        <div className="mt-1 text-xl font-bold">{r.count}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {q.answers && (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {q.answers.length ? (
                    q.answers.map((a, n) => (
                      <blockquote
                        key={n}
                        className="rounded-xl border-l-4 border-indigo-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                      >
                        {a}
                      </blockquote>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">
                      No written answers.
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
