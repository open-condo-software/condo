/**
 * Generates v4 UUIDs in both browser and Node environments
 * @example
 * const uuid = generateUUIDv4()
 */
export function generateUUIDv4 (): string {
    // globalThis.crypto is available in: browsers, ESM Node ≥ 15, CJS Node ≥ 15
    const webCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined

    if (webCrypto && typeof webCrypto.randomUUID === 'function') {
        return webCrypto.randomUUID()
    }

    let randomValues: Uint8Array

    if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
        randomValues = new Uint8Array(16)
        webCrypto.getRandomValues(randomValues)
    } else {
        // Fallback for CJS Node < 15 where globalThis.crypto is absent.
        // Wrapped in try/catch so bundlers (webpack/esbuild) can tree-shake it safely.
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { randomBytes } = require('crypto')
            randomValues = randomBytes(16)
        } catch {
            throw new Error('No secure random source available in this environment')
        }
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
