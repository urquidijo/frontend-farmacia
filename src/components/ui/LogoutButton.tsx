"use client";
export function LogoutButton() {
  return (
    <button
      className="rounded-lg border px-3 py-1.5 text-sm hover:border-emerald-600"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/"; // o router.push("/")
      }}
    >
      Cerrar sesión
    </button>
  );
}
