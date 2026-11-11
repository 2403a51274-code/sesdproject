import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function ShortRedirectPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params?.code;
  if (!code) {
    redirect("/");
  }

  // Redirect directly through the backend redirection handler so telemetry is recorded
  redirect(`${API_BASE_URL.replace(/\/+$/, "")}/r/${encodeURIComponent(code)}`);
}
