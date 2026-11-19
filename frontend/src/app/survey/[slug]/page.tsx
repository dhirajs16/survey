"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Survey } from "@/lib/types";
import { Icon } from "@/components/Icons";
import { LoadingSpinner } from "@/components/LoadingSpinner";
export default function PublicSurveyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fatal, setFatal] = useState("");
  useEffect(() => {
    api
      .publicSurvey(slug)
      .then(setSurvey)
      .catch(() =>
        setFatal(
          "This survey is unavailable. It may be unpublished or the link may be incorrect.",
        ),
      )
      .finally(() => setLoading(false));
  }, [slug]);
  const visible = useMemo(
    () =>
      survey?.questions.filter(
        (q) =>
          !q.condition ||
          answers[q.condition.question_id] === q.condition.value,
      ) ?? [],
    [survey, answers],
  );
  function set(id: string, value: unknown) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setErrors((e) => ({ ...e, [id]: "" }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!survey || submitting) return;
    const next: Record<string, string> = {};
    visible.forEach((q) => {
      const v = answers[q.id];
      if (
        q.required &&
        (v === undefined || v === "" || (Array.isArray(v) && !v.length))
      )
        next[q.id] = "Please answer this question.";
    });
    setErrors(next);
    if (Object.keys(next).length) {
      document
        .getElementById(`question-${Object.keys(next)[0]}`)
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      const allowed = new Set(visible.map((q) => q.id));
      await api.submit(
        slug,
        Object.fromEntries(
          Object.entries(answers).filter(([k]) => allowed.has(k)),
        ),
      );
      setDone(true);
      scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const x = e as ApiError;
      if (x.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(x.errors).forEach(
          ([k, v]) => (mapped[k.replace("answers.", "")] = v[0]),
        );
        setErrors(mapped);
      } else setFatal(x.message);
    } finally {
      setSubmitting(false);
    }
  }
  if (loading) return <LoadingSpinner label="Loading survey…" fullPage />;
  if (fatal) return <State title="Survey unavailable" text={fatal} />;
  if (done)
    return (
      <State
        title="Response received"
        text="Thank you for taking the time to share your feedback. Your response has been recorded."
        success
      />
    );
  if (!survey) return null;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <form onSubmit={submit} className="mx-auto max-w-2xl">
        <header className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="h-2 bg-indigo-600" />
          <div className="p-6 sm:p-9">
            <div className="mb-5 flex items-center gap-2 text-sm font-bold text-indigo-600">
              <span className="rounded-lg bg-indigo-600 p-1.5 text-white">
                <Icon name="survey" className="h-4 w-4" />
              </span>
              Survey
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="mt-3 leading-7 text-slate-600">
                {survey.description}
              </p>
            )}
            <p className="mt-5 text-xs text-slate-400">
              <span className="text-red-500">*</span> Required question
            </p>
          </div>
        </header>
        <div className="space-y-4">
          {visible.map((q, i) => (
            <section
              id={`question-${q.id}`}
              key={q.id}
              className={`rounded-2xl border bg-white p-6 sm:p-7 ${errors[q.id] ? "border-red-300 ring-2 ring-red-50" : "border-slate-200"}`}
            >
              <label className="mb-4 block font-semibold leading-6 text-slate-800">
                <span className="mr-2 text-sm text-slate-400">{i + 1}.</span>
                {q.text} {q.required && <span className="text-red-500">*</span>}
              </label>
              {q.type === "text" && (
                <textarea
                  className="input min-h-28"
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                  placeholder="Type your answer here…"
                />
              )}
              {q.type === "rating" && (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => set(q.id, n)}
                      className={`grid h-12 w-12 place-items-center rounded-xl border font-bold ${answers[q.id] === n ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-600 hover:border-indigo-400"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {q.type === "multiple_choice" && (
                <div className="space-y-2">
                  {q.options?.map((o) => (
                    <label
                      key={o}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 ${answers[q.id] === o ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === o}
                        onChange={() => set(q.id, o)}
                        className="h-4 w-4 accent-indigo-600"
                      />
                      {o}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "checkbox" && (
                <div className="space-y-2">
                  {q.options?.map((o) => {
                    const values = (answers[q.id] as string[]) ?? [];
                    return (
                      <label
                        key={o}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 ${values.includes(o) ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <input
                          type="checkbox"
                          checked={values.includes(o)}
                          onChange={(e) =>
                            set(
                              q.id,
                              e.target.checked
                                ? [...values, o]
                                : values.filter((x) => x !== o),
                            )
                          }
                          className="h-4 w-4 accent-indigo-600"
                        />
                        {o}
                      </label>
                    );
                  })}
                </div>
              )}
              {errors[q.id] && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {errors[q.id]}
                </p>
              )}
            </section>
          ))}
        </div>
        <button
          disabled={submitting}
          className="btn btn-primary mt-6 min-w-36 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit response"}
        </button>
        <p className="mt-8 text-center text-xs text-slate-400">
          Your answers are submitted securely.
        </p>
      </form>
    </main>
  );
}
function State({
  title,
  text,
  success = false,
}: {
  title: string;
  text: string;
  success?: boolean;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
      <div className="card max-w-md p-9 text-center">
        <div
          className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full ${success ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
        >
          <Icon name={success ? "check" : "survey"} />
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 leading-7 text-slate-500">{text}</p>
      </div>
    </main>
  );
}
