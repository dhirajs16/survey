import { Analytics, Dashboard, Survey } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");
export type AdminUser = { id: number; name: string; email: string };
export class ApiError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>,
    public status?: number,
  ) {
    super(message);
  }
}
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() ?? "GET";
  const xsrf = typeof document === "undefined" ? null : document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
    ?.slice("XSRF-TOKEN=".length);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(method !== "GET" && xsrf ? { "X-XSRF-TOKEN": decodeURIComponent(xsrf) } : {}),
      ...options?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      body.message ?? "Something went wrong.",
      body.errors,
      response.status,
    );
  return body;
}
export const api = {
  csrf: () => fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, { credentials: "include" }),
  login: async (email: string, password: string, remember = false) => {
    await api.csrf();
    return (await request<{ data: AdminUser }>("/login", { method: "POST", body: JSON.stringify({ email, password, remember }) })).data;
  },
  user: async () => (await request<{ data: AdminUser }>("/user")).data,
  logout: () => request<{ message: string }>("/logout", { method: "POST" }),
  dashboard: async () =>
    (await request<{ data: Dashboard }>("/admin/dashboard")).data,
  surveys: async () =>
    (await request<{ data: Survey[] }>("/admin/surveys")).data,
  survey: async (id: string | number) =>
    (await request<{ data: Survey }>(`/admin/surveys/${id}`)).data,
  create: async (data: Partial<Survey>) =>
    (
      await request<{ data: Survey }>("/admin/surveys", {
        method: "POST",
        body: JSON.stringify(data),
      })
    ).data,
  update: async (id: number, data: Partial<Survey>) =>
    (
      await request<{ data: Survey }>(`/admin/surveys/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    ).data,
  remove: (id: number) => request(`/admin/surveys/${id}`, { method: "DELETE" }),
  status: async (id: number, action: "publish" | "unpublish") =>
    (
      await request<{ data: Survey }>(`/admin/surveys/${id}/${action}`, {
        method: "POST",
      })
    ).data,
  publicSurvey: async (slug: string) =>
    (await request<{ data: Survey }>(`/public/surveys/${slug}`)).data,
  submit: (slug: string, answers: Record<string, unknown>) =>
    request<{ message: string }>(`/public/surveys/${slug}/responses`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  analytics: async (id: string | number) =>
    (await request<{ data: Analytics }>(`/admin/surveys/${id}/analytics`)).data,
};
