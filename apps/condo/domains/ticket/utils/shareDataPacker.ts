import crypto from 'crypto'
import zlib from 'zlib'

const MODERN_ALGORITHM = 'aes-256-ctr'
const LEGACY_ALGORITHM = 'aes-256-cbc'

// NOTE: It's a hard-coded credentials by @leonid-d from 2021.
// Good news: This data doesn't contain any secrets ...
// and it's hard to change this key because we have many existing links ...
// nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
const KEY = '900150983cd24fb0d6963f7d28e17f72'

const CRYPTO_ENCODING = 'base64'
const IV_LENGTH = 16 // 16 bytes for AES-CTR
const INFLATE_MARKER = '2:'
const BROTLI_MARKER = '3:'

/**
 * Re-implementation of Node.js <= 16 behaviour
 */
function evpBytesToKey (password: Buffer, salt: Buffer, keyLen = 32, ivLen = 16) {
    let out = Buffer.alloc(0), prev: Buffer<ArrayBufferLike> = Buffer.alloc(0)
    while (out.length < keyLen + ivLen) {
        // NOTE: not used for real encryption, just to encode public data and only for legacy links
        // nosemgrep: javascript.lang.security.audit.md5-used-as-password.md5-used-as-password
        prev = crypto.createHash('md5').update(prev).update(password).update(salt).digest()
        out = Buffer.concat([out, prev])
    }
    return {
        key: out.subarray(0, keyLen),
        iv: out.subarray(keyLen, keyLen + ivLen),
    }
}

/**
 * @deprecated this one is used only for old links, consider removing it after some time
 */
function legacyUnpack (base64: string): string {
    const raw = Buffer.from(base64, CRYPTO_ENCODING)

    // NOTE: Links produced with createCipher() *never* contained “Salted__”.
    // They were MD5-derived with an *empty* salt.
    const salt = Buffer.alloc(0)                 // 0-byte salt
    const { key, iv } = evpBytesToKey(Buffer.from(KEY), salt)

    const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, key, iv)
    const plainBuf = Buffer.concat([decipher.update(raw), decipher.final()])

    return plainBuf.toString('utf8')
}

export function unpackShareData (data: string): string {
    const isBrotli = data.startsWith(BROTLI_MARKER)
    const isInflate = data.startsWith(INFLATE_MARKER)

    if (isBrotli || isInflate) {
        const markerLength = isBrotli ? BROTLI_MARKER.length : INFLATE_MARKER.length
        // New version with marker '3:' using AES-CTR
        const trimmedData = data.slice(markerLength)
        const encryptedText = Buffer.from(trimmedData, CRYPTO_ENCODING)

        // Using KEY directly as IV
        const iv = Buffer.from(KEY).subarray(0, IV_LENGTH)
        const decipher = crypto.createDecipheriv(MODERN_ALGORITHM, Buffer.from(KEY), iv)

        const decryptedBuffers = [decipher.update(encryptedText), decipher.final()]
        // NOTE: Brotli more efficient but it requires modern node version! please use it in a future
        return isBrotli
            ? zlib.brotliDecompressSync(Buffer.concat(decryptedBuffers)).toString('utf8')
            : zlib.inflateSync(Buffer.concat(decryptedBuffers)).toString('utf8')
    } else {
        return legacyUnpack(data)
    }
}

export function packShareData (data: string): string {
    // New version using AES-CTR and Deflate compression
    // Using KEY directly as IV
    const iv = Buffer.from(KEY).subarray(0, IV_LENGTH)
    const cipher = crypto.createCipheriv(MODERN_ALGORITHM, Buffer.from(KEY), iv)

    // NOTE: it's more efficient but its require modern node version! please use it in a future when we will use useModern = true by default!
    const compressedData = zlib.brotliCompressSync(Buffer.from(data), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }) // Use maximum Brotli compression level
    const encryptedBuffers = [cipher.update(compressedData), cipher.final()]

    const resultBuffer = Buffer.concat(encryptedBuffers)
    return BROTLI_MARKER + resultBuffer.toString(CRYPTO_ENCODING)
}
