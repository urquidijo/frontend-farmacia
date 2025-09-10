'use client'

type AvatarProps = {
  name?: string
  email: string
  size?: number
  className?: string
}

const COLORS = [
  'bg-emerald-600','bg-sky-600','bg-fuchsia-600',
  'bg-amber-600','bg-rose-600','bg-indigo-600','bg-teal-600',
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function initials(name?: string, email?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    const a = parts[0]?.[0] ?? ''
    const b = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (a + b).toUpperCase()
  }
  if (email) return email.split('@')[0].slice(0, 2).toUpperCase()
  return 'US'
}

export default function Avatar({ name, email, size = 32, className }: AvatarProps) {
  const text = initials(name, email)
  const color = COLORS[hash(email || text) % COLORS.length]
  const dim = `${size}px`
  const textSize = size >= 40 ? 'text-base' : size >= 32 ? 'text-sm' : 'text-xs'

  return (
    <div
      className={`${color} ${textSize} ${className ?? ''} text-white rounded-full grid place-items-center font-medium shadow`}
      style={{ width: dim, height: dim }}
      aria-label={`Avatar de ${name || email}`}
    >
      {text}
    </div>
  )
}
