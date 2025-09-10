export async function api<T>(path: string, init: RequestInit = {}) {
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`.replace(/\/$/, ''), {
...init,
credentials: 'include',
headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
cache: 'no-store',
})
if (!res.ok) throw new Error(await res.text())
return res.json() as Promise<T>
}