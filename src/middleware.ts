import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


export function middleware(req: NextRequest) {
const token = req.cookies.get('access_token')?.value
const isAdmin = req.nextUrl.pathname.startsWith('/admin')
if (!token && isAdmin) {
const url = req.nextUrl.clone()
url.pathname = '/login'
return NextResponse.redirect(url)
}
return NextResponse.next()
}


export const config = { matcher: ['/admin/:path*'] }