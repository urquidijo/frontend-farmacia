"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event("auth:changed")); 
        location.assign("/");
      } else {
        const text = await res.text();
        setErr(text || "Credenciales inválidas.");
      }
    } catch {
      setErr("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-xl font-semibold">Ingresar</h1>

      <input
        className="border p-2 w-full"
        placeholder="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        required
      />

      <input
        className="border p-2 w-full"
        placeholder="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        required
      />

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <button
        className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-60"
        disabled={loading || !email || !password}
      >
        {loading ? "Ingresando…" : "Entrar"}
      </button>

      <p className="text-sm">
        ¿No tienes cuenta?{" "}
        <a className="text-emerald-700" href="/register">
          Crear cuenta
        </a>
      </p>
    </form>
  );
}
