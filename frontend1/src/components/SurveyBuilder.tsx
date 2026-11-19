"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Question, QuestionType } from "@/lib/types";
import { Icon } from "./Icons";
import { LoadingSpinner } from "./LoadingSpinner";

const labels: Record<QuestionType, string> = {
  text: "Text input",
  multiple_choice: "Multiple choice",
  checkbox: "Checkboxes",
  rating: "Rating 1–5",
};
const makeQuestion = (): Question => ({
  id: `q_${crypto.randomUUID().slice(0, 8)}`,
  text: "",
  type: "text",
  required: false,
});
export function SurveyBuilder({ id }: { id?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [questions, setQuestions] = useState<Question[]>([makeQuestion()]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (id)
      api
        .survey(id)
        .then((s) => {
          setTitle(s.title);
          setDescription(s.description ?? "");
          setSlug(s.slug);
          setStatus(s.status);
          setQuestions(s.questions);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [id]);
  function patch(i: number, data: Partial<Question>) {
    setQuestions((q) => q.map((x, n) => (n === i ? { ...x, ...data } : x)));
  }
  function type(i: number, type: QuestionType) {
    patch(i, {
      type,
      options: ["multiple_choice", "checkbox"].includes(type)
        ? questions[i].options?.length
          ? questions[i].options
          : ["Option 1", "Option 2"]
        : undefined,
      condition: questions[i].condition,
    });
  }
  function move(i: number, d: number) {
    const next = [...questions];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setQuestions(next);
  }
  async function save(nextStatus = status) {
    setError("");
    setSuccess("");
    if (!title.trim()) {
      setError("Please add a survey title.");
      return;
    }
    if (questions.some((q) => !q.text.trim())) {
      setError("Every question needs question text.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        slug: slug || undefined,
        status: nextStatus,
        questions,
      };
      const saved = id
        ? await api.update(Number(id), payload)
        : await api.create(payload);
      setSuccess(
        nextStatus === "published"
          ? "Survey published successfully."
          : "Draft saved successfully.",
      );
      if (!id) router.replace(`/admin/surveys/${saved.id}/edit`);
      setSlug(saved.slug);
      setStatus(saved.status);
    } catch (e) {
      const x = e as ApiError;
      setError(x.errors ? Object.values(x.errors).flat()[0] : x.message);
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <LoadingSpinner label="Loading survey builder…" />;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-600">Survey builder</p>
          <h1 className="mt-1 text-2xl font-bold">
            {id ? "Edit survey" : "Create a new survey"}
          </h1>
        </div>
        <div className="flex gap-2">
          {slug && (
            <a
              target="_blank"
              href={`/survey/${slug}`}
              className="btn btn-secondary"
            >
              <Icon name="eye" />
              Preview
            </a>
          )}
          <button
            disabled={saving}
            onClick={() => save("draft")}
            className="btn btn-secondary"
          >
            Save draft
          </button>
          <button
            disabled={saving}
            onClick={() => save("published")}
            className="btn btn-primary"
          >
            {saving
              ? "Saving…"
              : status === "published"
                ? "Save & keep published"
                : "Publish survey"}
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}
      <section className="card mb-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label" htmlFor="title">
              Survey title
            </label>
            <input
              id="title"
              className="input text-lg font-semibold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Customer satisfaction survey"
            />
          </div>
          <div>
            <label className="label" htmlFor="slug">
              Public URL slug
            </label>
            <input
              id="slug"
              className="input"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                )
              }
              placeholder="Generated automatically"
            />
          </div>
          <div>
            <label className="label">Status</label>
            <div
              className={`input flex items-center gap-2 ${status === "published" ? "text-emerald-700" : "text-amber-700"}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${status === "published" ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              {status === "published" ? "Published" : "Draft"}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="input min-h-24 resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell respondents what this survey is about."
            />
          </div>
        </div>
      </section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Questions{" "}
          <span className="text-sm font-normal text-slate-400">
            ({questions.length})
          </span>
        </h2>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <section className="card overflow-hidden" key={q.id}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <span className="text-sm font-semibold text-slate-500">
                Question {i + 1}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="rounded p-1.5 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  disabled={i === questions.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded p-1.5 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  disabled={questions.length === 1}
                  onClick={() =>
                    setQuestions((x) => x.filter((_, n) => n !== i))
                  }
                  className="rounded p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                  aria-label="Remove"
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_210px]">
                <div>
                  <label className="label">Question text</label>
                  <input
                    className="input"
                    value={q.text}
                    onChange={(e) => patch(i, { text: e.target.value })}
                    placeholder="Ask a clear question"
                  />
                </div>
                <div>
                  <label className="label">Answer type</label>
                  <select
                    className="input"
                    value={q.type}
                    onChange={(e) => type(i, e.target.value as QuestionType)}
                  >
                    {Object.entries(labels).map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {["multiple_choice", "checkbox"].includes(q.type) && (
                <div>
                  <label className="label">Answer options</label>
                  <div className="space-y-2">
                    {q.options?.map((o, n) => (
                      <div className="flex gap-2" key={n}>
                        <input
                          className="input"
                          value={o}
                          onChange={(e) =>
                            patch(i, {
                              options: q.options?.map((x, j) =>
                                j === n ? e.target.value : x,
                              ),
                            })
                          }
                        />
                        <button
                          onClick={() =>
                            patch(i, {
                              options: q.options?.filter((_, j) => j !== n),
                            })
                          }
                          className="rounded-lg px-3 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove option"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        patch(i, {
                          options: [
                            ...(q.options ?? []),
                            `Option ${(q.options?.length ?? 0) + 1}`,
                          ],
                        })
                      }
                      className="text-sm font-semibold text-indigo-600"
                    >
                      + Add option
                    </button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => patch(i, { required: e.target.checked })}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  Required
                </label>
                {i > 0 && (
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(q.condition)}
                      onChange={(e) =>
                        patch(i, {
                          condition: e.target.checked
                            ? { question_id: "", value: "" }
                            : null,
                        })
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />
                    Conditional
                  </label>
                )}
              </div>
              {q.condition && (
                <div className="rounded-xl bg-indigo-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-indigo-900">
                    Show this question when…
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      className="input"
                      value={q.condition.question_id}
                      onChange={(e) =>
                        patch(i, {
                          condition: { question_id: e.target.value, value: "" },
                        })
                      }
                    >
                      <option value="">Choose an earlier question</option>
                      {questions
                        .slice(0, i)
                        .filter((x) => x.type === "multiple_choice")
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.text || "Untitled question"}
                          </option>
                        ))}
                    </select>
                    <select
                      className="input"
                      value={q.condition.value}
                      onChange={(e) =>
                        patch(i, {
                          condition: { ...q.condition!, value: e.target.value },
                        })
                      }
                    >
                      <option value="">Choose an answer</option>
                      {questions
                        .find((x) => x.id === q.condition?.question_id)
                        ?.options?.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
      <button
        onClick={() => setQuestions((q) => [...q, makeQuestion()])}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <Icon name="plus" />
        Add question
      </button>
    </div>
  );
}
