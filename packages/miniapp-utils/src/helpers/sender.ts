import { generateUUIDv4 } from './uuid'

export const FINGERPRINT_ID_COOKIE_NAME = 'userId'
export const FINGERPRINT_ID_LENGTH = 12

function makeId (length: number): string {
    const croppedLength = Math.min(length, 32)

    return generateUUIDv4().replaceAll('-', '').substring(0, croppedLength)
}

export function generateFingerprint (): string {
    return makeId(FINGERPRINT_ID_LENGTH)
}
