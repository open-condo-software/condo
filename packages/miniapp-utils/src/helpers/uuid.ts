import { randomBytes } from 'crypto'

/**
 * Generates v4 UUIDs in both browser and Node environments
 * @example
 * const uuid = generateUUIDv4()
 */
export function generateUUIDv4 (): string {
    let randomValues: Uint8Array

    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        // Browser or Node.js (if Node 19+ supports crypto.randomUUID)
        return crypto.randomUUID()
    } else if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        // Browser environment
        randomValues = new Uint8Array(16)
        window.crypto.getRandomValues(randomValues)
    } else {
        // Node.js environment
        randomValues = randomBytes(16)
    }

    // Setting the version (4) and variant (RFC4122)
    randomValues[6] = (randomValues[6] & 0x0f) | 0x40 // version 4
    randomValues[8] = (randomValues[8] & 0x3f) | 0x80 // variant

    return [...randomValues]
        .map((value, index) => {
            const hex = value.toString(16).padStart(2, '0')
            if (index === 4 || index === 6 || index === 8 || index === 10) {
                return `-${hex}`
            }
            return hex
        })
        .join('')
}
