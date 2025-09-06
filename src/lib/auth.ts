export type User = { id: number; name: string; email: string; createdAt: string };

const KEY = "user";

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setUser(u: User) {
  localStorage.setItem(KEY, JSON.stringify(u));
  // notificar a toda la app (y a otras pestañas con 'storage')
  window.dispatchEvent(new Event("auth:changed"));
}

export function clearUser() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("auth:changed"));
}
