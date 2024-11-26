const crypto = require('crypto')

const { compressors } = require('./compressors')
const { keyDerivers } = require('./keyDerivers')

const MODES_WITH_AUTH_TAG = new Set(['gcm'])
const AUTH_TAG_LENGTH = 16 // Recommended authentication tag length for GCM mode
const ITERATIONS_BUFFER_SIZE = 4 // number <= 2^32

class EncryptionVersion {
    id
    algorithm
    secret
    compressor
    keyDeriver
    keyLength
    ivLength
    mode

    constructor ({ id, algorithm, secret, compressor, keyDeriver }) {
        this.id = id
        this.algorithm = algorithm
        this.secret = secret
        this.compressor = compressors[compressor]
        this.keyDeriver = keyDerivers[keyDeriver]
        
        const cipherInfo = crypto.getCipherInfo(algorithm)
        if (!cipherInfo) {
            throw new Error(`Invalid algorithm at ${id}`)
        }

        this.keyLength = cipherInfo.keyLength
        this.ivLength = cipherInfo.ivLength || 0
        this.mode = cipherInfo.mode
    }

    encrypt (data) {
        data = this.compressor.compress(data)
        const { masterKey, iterations, salt } = this.keyDeriver.derive(this.secret, { keyLen: this.keyLength })
        const iv = this._generateIv()
        const cipher = this._getCipher(masterKey, iv)
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()])

        let authTag
        if (MODES_WITH_AUTH_TAG.has(this.mode)) {
            authTag = cipher.getAuthTag()
        } else {
            authTag = Buffer.alloc(AUTH_TAG_LENGTH)
        }
        const iterationsBuffer = Buffer.alloc(ITERATIONS_BUFFER_SIZE)
        iterationsBuffer.writeUInt32BE(iterations, 0)
        const encryptedPayload = Buffer.concat([salt, iv, iterationsBuffer, authTag, encrypted])

        return encryptedPayload.toString('base64')
    }

    decrypt (encryptedData) {
        // Convert from base64 to Buffer and extract components
        const encryptedPayload = Buffer.from(encryptedData, 'base64')
        const saltLength = this.keyDeriver.saltLength

        if (encryptedPayload.length <= saltLength + this.ivLength + 4 + AUTH_TAG_LENGTH) throw new Error('Unsupported state or unable to authenticate data')

        // Extract components
        const salt = encryptedPayload.subarray(0, saltLength)
        const iv = encryptedPayload.subarray(saltLength, saltLength + this.ivLength)
        const iterations = encryptedPayload.readUInt32BE(saltLength + this.ivLength)
        const authTag = encryptedPayload.subarray(saltLength + this.ivLength + ITERATIONS_BUFFER_SIZE, saltLength + this.ivLength + ITERATIONS_BUFFER_SIZE + AUTH_TAG_LENGTH)
        const encrypted = encryptedPayload.subarray(saltLength + this.ivLength + ITERATIONS_BUFFER_SIZE + AUTH_TAG_LENGTH)

        const { masterKey } = this.keyDeriver.derive(this.secret, { keyLen: this.keyLength, salt, iterations })
        const decipher = this._getDecipher(masterKey, iv)
        if (MODES_WITH_AUTH_TAG.has(this.mode)) {
            decipher.setAuthTag(authTag)
        }
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

        return this.compressor.decompress(decrypted).toString('utf-8')
    }

    _getCipher (secretKey, iv) {
        let gcmOptions
        if (MODES_WITH_AUTH_TAG.has(this.mode)) {
            gcmOptions = { authTagLength: AUTH_TAG_LENGTH }
        }

        return crypto.createCipheriv(this.algorithm, secretKey, iv, gcmOptions)
    }

    _getDecipher (secretKey, iv) {
        let gcmOptions
        if (MODES_WITH_AUTH_TAG.has(this.mode)) {
            gcmOptions = { authTagLength: AUTH_TAG_LENGTH }
        }

        return crypto.createDecipheriv(this.algorithm, secretKey, iv, gcmOptions)
    }

    _generateIv () {
        return this.ivLength === 0 ? null : crypto.randomBytes(this.ivLength)
    }
}

module.exports = {
    EncryptionVersion,
}