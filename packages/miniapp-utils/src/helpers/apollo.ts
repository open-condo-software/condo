import { parse as parseCookieString, serialize as serializeCookie } from 'cookie'
import { setCookie, getCookies } from 'cookies-next'

import { getProxyHeadersForIp } from './proxying'
import { getRequestIp } from './proxying'
import {
    FINGERPRINT_ID_COOKIE_NAME,
    generateFingerprint,
    getClientSideFingerprint,
} from './sender'
import { generateUUIDv4 } from './uuid'

import type { DefaultContext, RequestHandler } from '@apollo/client'
import type { IncomingMessage, ServerResponse } from 'http'

type Response = ServerResponse

type SSRContext = {
    headers: Record<string, string>
    defaultContext: DefaultContext
}

const SSR_DEFAULT_FINGERPRINT = 'webAppSSR'
const COOKIE_HEADER_NAME = 'cookie'
const REMOTE_APP_HEADER_NAME = 'x-remote-app'
const REMOTE_VERSION_HEADER_NAME = 'x-remote-version'
const REMOTE_CLIENT_HEADER_NANE = 'x-remote-client'
const REMOTE_ENV_HEADER_NAME = 'x-remote-env'
const TARGET_HEADER_NAME = 'x-target'
const START_REQUEST_ID_HEADER_NAME = 'x-start-request-id'
const PARENT_REQUEST_ID_HEADER_NAME = 'x-parent-request-id'

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

function generateRequestId () {
    return `BR${generateUUIDv4().replaceAll('-', '')}`
}

export function getTracingMiddleware (options: TracingMiddlewareOptions): RequestHandler {
    return function (operation, forward) {
        operation.setContext((previousContext: DefaultContext) => {
            const { headers: previousHeaders } = previousContext

            const reqId = generateRequestId()

            const headers = {
                ...previousHeaders,
                [REMOTE_APP_HEADER_NAME]: options.serviceUrl,
                [REMOTE_VERSION_HEADER_NAME]: options.codeVersion,
                [PARENT_REQUEST_ID_HEADER_NAME]: reqId,
                [START_REQUEST_ID_HEADER_NAME]: reqId,
            }

            if (options.target) {
                headers[TARGET_HEADER_NAME] = options.target
            }

            headers[REMOTE_ENV_HEADER_NAME] = typeof document === 'undefined' ? 'SSR' : 'CSR'



            // NOTE: CSR
            if (typeof document !== 'undefined' && document.cookie) {
                headers[REMOTE_CLIENT_HEADER_NANE] = getClientSideFingerprint()
            } else if (headers[COOKIE_HEADER_NAME]) {
                const ssrCookies = parseCookieString(headers[COOKIE_HEADER_NAME])

                headers[REMOTE_CLIENT_HEADER_NANE] = ssrCookies[FINGERPRINT_ID_COOKIE_NAME] || SSR_DEFAULT_FINGERPRINT
            }


            return {
                ...previousContext,
                headers,
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
