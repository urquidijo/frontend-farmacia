'use client'
import { ReactNode } from 'react'


type Props = { perms?: string[]; need: string | string[]; children: ReactNode }
export default function Can({ perms = [], need, children }: Props) {
const required = Array.isArray(need) ? need : [need]
const ok = required.every((p) => perms.includes(p))
if (!ok) return null
return <>{children}</>
}