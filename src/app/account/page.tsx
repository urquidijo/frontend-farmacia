"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth"; // <-- usa el helper que guarda/lee el user

type Payload = { name: string; email: string; password: string };

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    msg: string;
  } | null>(null);
  const [ready, setReady] = useState(false); // evita parpadeo/hydration

  // ⛔️ Si ya está logeado, no mostrar esta página: redirige
  useEffect(() => {
    const u = getUser();
    if (u) {
      router.replace("/account"); 
    } else {
      setReady(true);
    }
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
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      password: String(fd.get("password") || ""),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || `Error ${res.status}`);

      router.replace(
        `/account/login`
      );
      return;
    } catch (err: any) {
      setFeedback({
        type: "err",
        msg: err?.message || "No se pudo crear el usuario.",
      });
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
          <input
            name="name"
            className="w-full rounded-lg border px-3 py-2"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input
            name="email"
            type="email"
            className="w-full rounded-lg border px-3 py-2"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input
            name="password"
            type="password"
            className="w-full rounded-lg border px-3 py-2"
            autoComplete="new-password"
          />
        </div>

        {feedback && (
          <p
            className={`text-sm ${
              feedback.type === "ok" ? "text-emerald-700" : "text-red-600"
            }`}
          >
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
