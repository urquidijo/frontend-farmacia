import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/analytics/analyze-rfm`

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Cookie: req.headers.get('cookie') || '',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to analyze' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
