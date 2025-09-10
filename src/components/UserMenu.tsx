"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";

export type Me = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  permissions: string[];
};

type Props = { me: Me };

export default function UserMenu({ me }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const can = (p: string) => me.permissions?.includes(p);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.dispatchEvent(new Event("auth:changed"));
    location.assign("/");
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="flex items-center gap-2 rounded-full hover:bg-zinc-100 px-1.5 py-1"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar
          name={`${me.firstName} ${me.lastName}`}
          email={me.email}
          size={32}
        />
        <span className="hidden sm:block text-sm text-zinc-700">
          {me.firstName}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          className="text-zinc-500"
        >
          <path d="M5 7l5 5 5-5" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="z-50 absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-xl ring-1 ring-black/5 py-1 text-sm"
        >
          <Link
            href="/account"
            className="block px-3 py-2 hover:bg-zinc-50"
            role="menuitem"
          >
            Mi cuenta
          </Link>
          {can("user.read") && (
            <Link
              href="/admin/users"
              className="block px-3 py-2 hover:bg-zinc-50"
              role="menuitem"
            >
              Panel admin
            </Link>
          )}
          <button
            className="w-full text-left px-3 py-2 hover:bg-zinc-50 text-rose-600"
            onClick={onLogout}
            role="menuitem"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
