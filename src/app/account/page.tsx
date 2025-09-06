"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

type Payload = { name: string; email: string; password: string };
type Feedback = { type: "ok" | "err"; msg: string } | null;


// Error estándar del backend
type ApiError = { message: string };

// Helpers sin `any`
function isApiError(v: unknown): v is ApiError {
  if (typeof v !== "object" || v === null) return false;
  const maybe = v as Record<string, unknown>;
  return typeof maybe.message === "string";
}
function getErrorMessage(data: unknown, fallback: string): string {
  return isApiError(data) ? data.message : fallback;
}

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [ready, setReady] = useState(false);

  // si ya está logeado, redirige
  useEffect(() => {
    const u = getUser();
    if (u) router.replace("/account");
    else setReady(true);
  }, [router]);

  if (!ready) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    const el = formRef.current;
    if (!el) return;

    const fd = new FormData(el);
    const payload: Payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = getErrorMessage(data, `Error ${res.status}`);
        throw new Error(msg);
      }

      router.replace(`/account/login`);
      return; 
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el usuario.";
      setFeedback({ type: "err", msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold">Crear cuenta</h1>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-sm">Nombre</label>
          <input name="name" className="w-full rounded-lg border px-3 py-2" autoComplete="name" />
        </div>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input name="email" type="email" className="w-full rounded-lg border px-3 py-2" autoComplete="email" />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input name="password" type="password" className="w-full rounded-lg border px-3 py-2" autoComplete="new-password" />
        </div>

        {feedback && (
          <p className={`text-sm ${feedback.type === "ok" ? "text-emerald-700" : "text-red-600"}`}>
            {feedback.msg}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
