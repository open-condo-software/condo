/**
 * Middleware to allow all requests from condo through CORS
 */

import { NextRequest, NextResponse } from 'next/server'

import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'


const CONDO_DOMAIN = process.env.NEXT_PUBLIC_CONDO_DOMAIN || 'https://condo.app.localhost:8009'
const APP_DOMAIN = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const OIDC_CALLBACK_ENDPOINT = '/api/auth/condo/callback'
const ALLOWED_ORIGINS = new Set([CONDO_DOMAIN, APP_DOMAIN].filter(nonNull))


const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
}

function getACAOHeader (req: NextRequest) {
    const origin = req.headers.get('origin')
    if (!origin) return null

    // NOTE: Basic scenario
    if (ALLOWED_ORIGINS.has(origin)) return origin

    // NOTE: Background OIDC callback endpoint
    if (origin !== 'null') return null

    const reqUrl = new URL(req.url, APP_DOMAIN)
    const path = reqUrl.pathname
    if (path === OIDC_CALLBACK_ENDPOINT) {
        return 'null'
    }

    return null
}

export function middleware (request: NextRequest): NextResponse {
    const isPreflight = request.method === 'OPTIONS'
    const acaoHeader = getACAOHeader(request)
    const corsHeaders = { ...CORS_HEADERS }

    if (acaoHeader) {
        corsHeaders['Access-Control-Allow-Origin'] = acaoHeader
    }


    if (isPreflight) {
        return NextResponse.json({}, { headers: corsHeaders })
    }

    const response = NextResponse.next()

    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
    })

    return response
}

export const config = {
    runtime: 'nodejs',
}
