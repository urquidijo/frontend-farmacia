
"use client";
import { useEffect, useState } from "react";
import { getUser, type User } from "@/lib/auth";

export default function useAuthState() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sync = () => setUser(getUser());
    sync(); // estado inicial
    window.addEventListener("auth:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return user;
}
