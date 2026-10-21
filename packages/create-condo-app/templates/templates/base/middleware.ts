/**
 * Middleware to allow all requests from condo through CORS
 */

import { NextRequest, NextResponse } from 'next/server'

const CONDO_DOMAIN = process.env.NEXT_PUBLIC_CONDO_DOMAIN || 'https://condo.d.doma.ai'


const CORS_HEADERS = {
    'Access-Control-Allow-Origin': CONDO_DOMAIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
}

export function middleware (request: NextRequest): NextResponse {
    const isPreflight = request.method === 'OPTIONS'



    if (isPreflight) {
        return NextResponse.json({}, { headers: CORS_HEADERS })
    }

    const response = NextResponse.next()

    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
    })

    return response
}

export const config = {
    runtime: 'nodejs',
}
