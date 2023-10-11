import { NextRequest, NextResponse, NextMiddleware } from 'next/server'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4006'

export function middleware (req: NextRequest): ReturnType<NextMiddleware> {
    const route = req.nextUrl.pathname
    if (route === '/graphql') {
        return NextResponse.rewrite(`${SERVER_URL}/admin/api`)
    }
}