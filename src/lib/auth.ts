export type Me = {
id: number
email: string
firstName: string
lastName: string
permissions: string[]
}


export async function getMe(): Promise<Me | null> {
try {
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
credentials: 'include',
cache: 'no-store',
})
if (!res.ok) return null
return (await res.json()) as Me
} catch {
return null
}
}