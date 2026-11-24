import { getIronSession } from 'iron-session'
import getConfig from 'next/config'

import type { IncomingMessage, ServerResponse } from 'http'
import type { SessionOptions } from 'iron-session'

const {
    serverRuntimeConfig: {
        cookieSecret,
    },
} = getConfig()

if (!cookieSecret && (process.env.NODE_ENV === 'production' && cookieSecret.length < 32)) {
    throw new Error('SESSION_SECRET_KEY must be set and at least 32 characters long!')
}

type SessionShape = {
    oidcAccessToken?: string
    oidcIdToken?: string
}

const SESSION_SECRET_KEY = cookieSecret
export const SESSION_TTL_IN_SECONDS = 60 * 60 * 24 * 7 // 7 days

export const SESSION_OPTIONS: SessionOptions = {
    cookieName: 'session.id',
    password: SESSION_SECRET_KEY,
    cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: SESSION_TTL_IN_SECONDS,
    },
    ttl: SESSION_TTL_IN_SECONDS,
}

export async function getSession (req: IncomingMessage, res: ServerResponse) {
    return await getIronSession<SessionShape>(req, res, SESSION_OPTIONS)
}