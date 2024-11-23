import crypto from 'crypto'
import zlib from 'zlib'

const ALGORITHM = 'aes256'
const MODERN_ALGORITHM = 'aes-256-ctr'

// NOTE: It's a hard-coded credentials by @leonid-d from 2021.
// Good news: This data doesn't contain any secrets ...
// and it's hard to change this key because we have many existing links ...
// nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
const KEY = '900150983cd24fb0d6963f7d28e17f72'

const CRYPTOENCODING = 'base64'
const IV_LENGTH = 16 // 16 bytes for AES-CTR
const MODERN_MARKER = '2:'

export function unpackShareData (data: string): string {
    if (data.startsWith(MODERN_MARKER)) {
        // New version with marker '2:' using AES-CTR
        const trimmedData = data.slice(MODERN_MARKER.length)
        const encryptedText = Buffer.from(trimmedData, CRYPTOENCODING)

        // Using KEY directly as IV
        const iv = Buffer.from(KEY).subarray(0, IV_LENGTH)
        const decipher = crypto.createDecipheriv(MODERN_ALGORITHM, Buffer.from(KEY), iv)

        const decryptedBuffers = [decipher.update(encryptedText), decipher.final()]
        // NOTE: it's more efficient but its require modern node version! please use it in a future
        // const decompressedText = zlib.brotliDecompressSync(Buffer.concat(decryptedBuffers)).toString('utf8')
        const decompressedText = zlib.inflateSync(Buffer.concat(decryptedBuffers)).toString('utf8')
        return decompressedText
    } else {
        // Legacy format (backward compatibility)
        // nosemgrep: javascript.node-crypto.security.create-de-cipher-no-iv.create-de-cipher-no-iv
        const decipher = crypto.createDecipher(ALGORITHM, KEY)
        const decryptedBuffers = [decipher.update(data, CRYPTOENCODING), decipher.final()]
        const decryptedText = Buffer.concat(decryptedBuffers).toString('utf8')
        return decryptedText
    }
}

// NOTE: we still use old version and will use it until Node.js v23.3.0: https://nodejs.org/api/deprecations.html#DEP0106
// Probably we want also to use more efficient compression to reduce link size. At the moment I leave old encryption version
export function packShareData (data: string, useModern = false): string {
    if (useModern) {
        // New version using AES-CTR and Deflate compression
        // Using KEY directly as IV
        const iv = Buffer.from(KEY).subarray(0, IV_LENGTH)
        const cipher = crypto.createCipheriv(MODERN_ALGORITHM, Buffer.from(KEY), iv)

        // NOTE: it's more efficient but its require modern node version! please use it in a future when we will use useModern = true by default!
        // const compressedData = zlib.brotliCompressSync(Buffer.from(data), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }) // Use maximum Brotli compression level
        const compressedData = zlib.deflateSync(Buffer.from(data))
        const encryptedBuffers = [cipher.update(compressedData), cipher.final()]

        const resultBuffer = Buffer.concat(encryptedBuffers)
        return MODERN_MARKER + resultBuffer.toString(CRYPTOENCODING)
    } else {
        // Legacy format (backward compatibility)
        // nosemgrep: javascript.node-crypto.security.create-de-cipher-no-iv.create-de-cipher-no-iv
        const cipher = crypto.createCipher(ALGORITHM, KEY)
        const encryptedBuffers = [cipher.update(data, 'utf8'), cipher.final()]
        const encryptedText = Buffer.concat(encryptedBuffers).toString(CRYPTOENCODING)
        return encryptedText
    }
}
