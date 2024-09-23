import { getCookie, setCookie } from 'cookies-next'

import { generateUUIDv4 } from './uuid'

type SenderInfo = {
    dv: number,
    fingerprint: string
}

export const FINGERPRINT_ID_COOKIE_NAME = 'fingerprint'
export const FINGERPRINT_ID_LENGTH = 12

function makeId (length: number): string {
    const croppedLength = Math.min(length, 32)

    return generateUUIDv4().replaceAll('-', '').substring(0, croppedLength)
}

export function generateFingerprint (): string {
    return makeId(FINGERPRINT_ID_LENGTH)
}

export function getClientSideFingerprint (): string {
    let fingerprint = getCookie(FINGERPRINT_ID_COOKIE_NAME)
    if (!fingerprint) {
        fingerprint = generateFingerprint()
        setCookie(FINGERPRINT_ID_COOKIE_NAME, fingerprint)
    }

    return fingerprint
}

export function getClientSideSenderInfo (): SenderInfo {
    return {
        dv: 1,
        fingerprint: getClientSideFingerprint(),
    }
}
