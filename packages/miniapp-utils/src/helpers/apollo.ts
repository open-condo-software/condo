import { serialize as serializeCookie } from 'cookie'
import { setCookie, getCookies } from 'cookies-next'

import { getProxyHeadersForIp } from './proxying'
import { getRequestIp } from './proxying'
import {
    FINGERPRINT_ID_COOKIE_NAME,
    generateFingerprint,
} from './sender'
import { getAppTracingHeaders } from './tracing'

import type { DefaultContext, RequestHandler } from '@apollo/client'
import type { IncomingMessage, ServerResponse } from 'http'

type Response = ServerResponse

type SSRContext = {
    headers: Record<string, string>
    defaultContext: DefaultContext
}

export type TracingMiddlewareOptions = {
    serviceUrl: string
    codeVersion: string
    target?: string
}

export type SSRProxyingMiddlewareOptions = {
    apiUrl: string
    proxyId?: string
    proxySecret?: string
}

export function getTracingMiddleware (options: TracingMiddlewareOptions): RequestHandler {
    return function (operation, forward) {
        operation.setContext((previousContext: DefaultContext) => {
            const { headers: previousHeaders } = previousContext

            return {
                ...previousContext,
                headers: getAppTracingHeaders({
                    ...options,
                    previousHeaders,
                }),
            }
        })

        return forward(operation)
    }
}

export function getSSRProxyingMiddleware ({ proxyId, proxySecret, apiUrl }: SSRProxyingMiddlewareOptions): RequestHandler {
    return function (operation, forward) {
        operation.setContext((previousContext: DefaultContext) => {
            if (typeof previousContext.clientIp !== 'string' || !proxyId || !proxySecret) return previousContext
            const proxyHeaders = getProxyHeadersForIp(
                'POST',
                apiUrl,
                previousContext.clientIp,
                proxyId,
                proxySecret,
            )

            return {
                ...previousContext,
                headers: {
                    ...previousContext.headers,
                    ...proxyHeaders,
                },
            }
        })

        return forward(operation)
    }
}

export function prepareSSRContext (req?: IncomingMessage, res?: Response): SSRContext {
    if (!req) {
        return {
            headers: {},
            defaultContext: {},
        }
    }

    const requestCookies = getCookies({ req, res })

    if (!requestCookies[FINGERPRINT_ID_COOKIE_NAME]) {
        const fingerprint = generateFingerprint()
        requestCookies[FINGERPRINT_ID_COOKIE_NAME] = fingerprint
        // NOTE: req and res are used to operate "set-cookie" headers
        setCookie(FINGERPRINT_ID_COOKIE_NAME, fingerprint, { req, res })
    }

    const cookieHeader = Object.entries(requestCookies)
        .map(([name, value]) => value ? serializeCookie(name, value) : null)
        .filter(Boolean)
        .join(';')

    const clientIp = getRequestIp(req, () => true)

    return {
        headers: {
            cookie: cookieHeader,
        },
        defaultContext: {
            clientIp,
        },
    }
}
