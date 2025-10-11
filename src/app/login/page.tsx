"use client";

import { useState } from "react";
import { Mail, Lock, Heart, ShieldCheck } from "lucide-react";
import { logOk, logFail } from "@/lib/bitacora";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  
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

      const data = await res.json().catch(() => null);

      if (res.ok && data) {
        // 1) guardar en localStorage
        localStorage.setItem("auth.userId", String(data.user?.id));
        localStorage.setItem("auth.email", String(data.user?.email ?? ""));
        localStorage.setItem("auth.ip", String(data.ip ?? ""));

        // 2) registrar bitácora (EXITOSO)
         await logOk("LOGIN", { userId: data.user?.id ?? null, ip: data.ip ?? null });

        // 3) avisar y redirigir
        window.dispatchEvent(new Event("auth:changed"));
        location.assign("/");
      } else {
        const ip = data?.ip ?? null;

        // Registrar bitácora (FALLIDO) con el ip que el backend incluyó
        await logFail("LOGIN", { userId: null, ip });

        setErr(data?.message || "Credenciales inválidas.");
      }
    } catch {
      setErr("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
      <div className="h-full w-full flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 shadow">
              💊
            </span>
            <h1 className="text-2xl font-bold text-emerald-700 mt-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-zinc-500 text-sm">
              Ingresa a tu cuenta y gestiona tus pedidos fácilmente
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="relative block">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
              <input
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Correo electrónico"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="relative block">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
              <input
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Contraseña"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {err && <p className="text-red-600 text-sm">{err}</p>}

            <button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold shadow disabled:opacity-60 transition-colors"
              disabled={loading || !email || !password}
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>
          </form>

          {/* Extras */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-xs text-zinc-400">o continúa con</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          <div className="flex gap-3 justify-center">
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-zinc-50 transition">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-zinc-700">Cuenta segura</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-zinc-50 transition">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-sm text-zinc-700">Farmacia+</span>
            </button>
          </div>

          <p className="text-sm text-center text-zinc-600">
            ¿No tienes cuenta?{" "}
            <a className="text-emerald-700 hover:underline" href="/register">
              Crear cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
