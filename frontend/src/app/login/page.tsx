"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.user().then(() => router.replace("/admin")).catch(() => setChecking(false));
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.login(email, password, remember);
      router.replace("/admin");
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(apiError.errors?.email?.[0] ?? apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) return <LoadingSpinner label="Checking your session…" fullPage />;

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
    <div className="w-full max-w-md">
      <div className="mb-7 flex items-center justify-center gap-3 text-2xl font-bold">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-white"><Icon name="survey" /></span>
        Survey
      </div>
      <form onSubmit={submit} className="card p-7 sm:p-9">
        <h1 className="text-2xl font-bold">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to create surveys and review responses.</p>
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mt-6"><label className="label" htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div className="mt-4"><label className="label" htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-indigo-600" />Remember me</label>
        <button disabled={submitting} className="btn btn-primary mt-6 w-full py-3 disabled:opacity-60">{submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Signing in…</> : "Sign in"}</button>
      </form>
    </div>
  </main>;
}
