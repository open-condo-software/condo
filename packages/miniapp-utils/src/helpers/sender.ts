import { getCookie, setCookie } from 'cookies-next'

import { generateUUIDv4 } from './uuid'

type SenderInfo = {
    dv: number
    fingerprint: string
}

/** Name of the cookie in which the fingerprint will be stored */
export const FINGERPRINT_ID_COOKIE_NAME = 'fingerprint'
/** Default fingerprint length */
export const FINGERPRINT_ID_LENGTH = 32

function makeId (length: number): string {
    const croppedLength = Math.min(length, 32)

    return generateUUIDv4().replaceAll('-', '').substring(0, croppedLength)
}

export function generateFingerprint (): string {
    return makeId(FINGERPRINT_ID_LENGTH)
}

/**
 * Creates a device fingerprint in the browser environment
 * that can be used to send mutations in open-condo applications,
 * uses cookies for storage between sessions.
 * Mostly used to generate the sender field in getClientSideSenderInfo.
 * So consider using it instead
 */
export function getClientSideFingerprint (): string {
    let fingerprint = getCookie(FINGERPRINT_ID_COOKIE_NAME)
    if (!fingerprint) {
        fingerprint = generateFingerprint()
        setCookie(FINGERPRINT_ID_COOKIE_NAME, fingerprint)
    }

    return fingerprint
}

/**
 * Creates a device fingerprint in the browser environment
 * that can be used to send mutations in open-condo applications.
 * Uses cookies for storage between sessions
 * @example
 *  submitReadingsMutation({
 *     variables: {
 *         data: {
 *             ...values,
 *             dv: 1,
 *             sender: getClientSideSenderInfo(),
 *             meter: { connect: { id: meter.id } },
 *             source: { connect: { id: METER_READING_MOBILE_APP_SOURCE_ID } },
 *         },
 *     },
 * })
 */
export function getClientSideSenderInfo (): SenderInfo {
    return {
        dv: 1,
        fingerprint: getClientSideFingerprint(),
    }
}
