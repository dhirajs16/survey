"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminUser, api } from "@/lib/api";
import { Icon } from "./Icons";
import { LoadingSpinner } from "./LoadingSpinner";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    api.user().then(setUser).catch(() => router.replace("/login")).finally(() => setChecking(false));
  }, [router]);
  async function logout() {
    await api.logout();
    router.replace("/login");
  }
  if (checking || !user) return <LoadingSpinner label="Checking your session…" fullPage />;
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white px-5 py-7 lg:block">
        <Link
          href="/admin"
          className="mb-10 flex items-center gap-3 px-2 text-xl font-bold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <Icon name="survey" />
          </span>
          Survey
        </Link>
        <nav className="space-y-1 text-sm font-medium">
          <Link
            className={`nav ${path === "/admin" ? "nav-active" : ""}`}
            href="/admin"
          >
            <Icon name="grid" />
            Dashboard
          </Link>
          <Link
            className={`nav ${path.startsWith("/admin/surveys") ? "nav-active" : ""}`}
            href="/admin/surveys"
          >
            <Icon name="survey" />
            Surveys
          </Link>
        </nav>
        <div className="absolute inset-x-5 bottom-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
          Signed in as
          <br />
          <span className="font-medium text-slate-700">{user.email}</span>
          <button onClick={logout} className="mt-3 block font-semibold text-indigo-600 hover:text-indigo-800">Sign out</button>
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:ml-64 lg:px-10">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-bold lg:hidden"
        >
          <span className="rounded-lg bg-indigo-600 p-1.5 text-white">
            <Icon name="survey" className="h-4 w-4" />
          </span>
          Survey
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:block">
            Survey workspace
          </span>
          <button onClick={logout} title="Sign out" className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{user.name.charAt(0).toUpperCase()}</button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 lg:ml-64 lg:px-10">
        {children}
      </main>
    </div>
  );
}
