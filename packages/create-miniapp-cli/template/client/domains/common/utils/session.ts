import { getIronSession } from 'iron-session'
import getConfig from 'next/config'

import conf from '@open-condo/config'

import type { IncomingMessage, ServerResponse } from 'http'
import type { SessionOptions, IronSessionData } from 'iron-session'

const {
    serverRuntimeConfig: {
        sessionSecretKey,
    },
} = getConfig()

const SESSION_SECRET_KEY = sessionSecretKey || 'client_template_secret_key_at_least_32_chars'

if (!sessionSecretKey && conf.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET_KEY is required in production for session-based auth')
}

if (!sessionSecretKey) {
    console.warn('[create-miniapp-cli] SESSION_SECRET_KEY is not set, using development fallback secret')
}

declare module 'iron-session' {
    interface IronSessionData {
        accessToken?: string
        idToken?: string
        oidcChecks?: { nonce: string, state: string }
        nextUrl?: string
    }
}

export const sessionOptions: SessionOptions = {
    cookieName: 'miniapp.session',
    password: SESSION_SECRET_KEY,
    cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 60 * 24 * 360,
    },
    ttl: 60 * 60 * 24 * 360,
}

export async function getSession (req: IncomingMessage | Request, res: Response | ServerResponse<IncomingMessage>) {
    return await getIronSession<IronSessionData>(req, res, sessionOptions)
}
