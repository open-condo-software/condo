import { parse as parseCookieString } from 'cookie'

import {
    FINGERPRINT_ID_COOKIE_NAME,
    getClientSideFingerprint,
} from './sender'
import { generateUUIDv4 } from './uuid'

export type TracingOptions = {
    serviceUrl: string
    codeVersion: string
    target?: string
    previousHeaders?: Record<string, string>
}

const SSR_DEFAULT_FINGERPRINT = 'webAppSSR'
const COOKIE_HEADER_NAME = 'cookie'
const REMOTE_APP_HEADER_NAME = 'x-remote-app'
const REMOTE_VERSION_HEADER_NAME = 'x-remote-version'
const REMOTE_CLIENT_HEADER_NAME = 'x-remote-client'
const REMOTE_ENV_HEADER_NAME = 'x-remote-env'
const TARGET_HEADER_NAME = 'x-target'
const START_REQUEST_ID_HEADER_NAME = 'x-start-request-id'
const PARENT_REQUEST_ID_HEADER_NAME = 'x-parent-request-id'

function generateRequestId () {
    return `BR${generateUUIDv4().replaceAll('-', '')}`
}

export function getAppTracingHeaders (options: TracingOptions) {
    const reqId = generateRequestId()

    const headers: Record<string, string> = {
        ...options.previousHeaders,
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
        headers[REMOTE_CLIENT_HEADER_NAME] = getClientSideFingerprint()
    } else if (headers[COOKIE_HEADER_NAME]) {
        const ssrCookies = parseCookieString(headers[COOKIE_HEADER_NAME])

        headers[REMOTE_CLIENT_HEADER_NAME] = ssrCookies[FINGERPRINT_ID_COOKIE_NAME] || SSR_DEFAULT_FINGERPRINT
    }

    return headers
}