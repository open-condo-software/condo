import cookie from 'cookie'

import { FINGERPRINT_ID_COOKIE_NAME, generateFingerprint } from './sender'
import { generateUUIDv4 } from './uuid'


import type { DefaultContext, RequestHandler } from '@apollo/client'

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
                const clientCookies = cookie.parse(document.cookie)

                // No cookie? Create one
                if (!clientCookies[FINGERPRINT_ID_COOKIE_NAME]) {
                    const userId = generateFingerprint()
                    clientCookies[FINGERPRINT_ID_COOKIE_NAME] = userId
                    document.cookie = [document.cookie, cookie.serialize(FINGERPRINT_ID_COOKIE_NAME, userId)]
                        .filter(Boolean)
                        .join(';')
                }

                headers[REMOTE_CLIENT_HEADER_NANE] = clientCookies[FINGERPRINT_ID_COOKIE_NAME]
            } else if (headers[COOKIE_HEADER_NAME]) {
                const ssrCookies = cookie.parse(headers[COOKIE_HEADER_NAME])

                headers[REMOTE_CLIENT_HEADER_NANE] = ssrCookies[FINGERPRINT_ID_COOKIE_NAME] || SSR_DEFAULT_FINGERPRINT
            }


            return {
                ...previousContext,
                headers: {
                    ...headers,

                },
            }
        })

        return forward(operation)
    }
}

// export function extractSSRHeaders () {
//
// }
