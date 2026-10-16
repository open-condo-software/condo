/**
 * Middleware to allow all requests from condo through CORS
 */

import { NextRequest, NextResponse } from 'next/server'

const CONDO_DOMAIN = process.env.NEXT_PUBLIC_CONDO_DOMAIN || 'https://condo.d.doma.ai'

export function middleware (request: NextRequest): NextResponse {
    const response = NextResponse.next()

    // Allow all requests to pass through with CORS headers
    response.headers.set('Access-Control-Allow-Origin', CONDO_DOMAIN)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
    response.headers.set('Access-Control-Allow-Headers', '*')

    return response
}
