import { NextRequest, NextResponse } from 'next/server'

const api = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { command, audio, mimeType } = body

    console.log('[Next.js API] Received body:', { command, audio: audio ? 'present' : 'missing', mimeType })

    // Validate that we have either command or audio
    if (!command && !audio) {
      console.log('[Next.js API] Validation failed: no command or audio')
      return NextResponse.json(
        { error: 'Debe proporcionar un comando de texto o audio' },
        { status: 400 }
      )
    }

    // Forward to backend voice assistant service
    const bodyToSend = {
      command,
      audio,
      mimeType,
    }

    console.log('[Next.js API] Sending to NestJS:', {
      url: `${api}/admin/voice-assistant`,
      body: bodyToSend,
      bodyString: JSON.stringify(bodyToSend),
    })

    const response = await fetch(`${api}/admin/voice-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
      },
      credentials: 'include',
      body: JSON.stringify(bodyToSend),
    })

    console.log('[Next.js API] NestJS response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || 'Error al procesar comando' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en voice assistant API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
