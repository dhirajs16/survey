import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Survey — Surveys made simple",
  description: "Create, publish, and understand beautiful surveys.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
