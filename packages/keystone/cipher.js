const crypto = require('crypto')

const { isEmpty } = require('lodash')

// since data is converted in hex, ':' shouldn't be in it
const SEPARATOR = ':'
const SUPPORTED_MODES = ['cbc', 'ctr', 'cfb', 'ofb', 'ecb']
const SUGGESTIONS = {
    'ecb': 'WARNING! Don\'t use "ecb" in real application as it is insecure!',
    'cfb': 'Please, consider using "ctr" or "cbc"',
    'ofb': 'Please, consider using "ctr" or "cbc"',
}

class CipherManager {

    /** @type {{[version: string]: {cipher: string, secret: string, ivLength: number}}} */
    versions = {}
    currentVersionKey
    
    /**
     * @param {Array<{version: string, cipher: string, secret: string}>} options
     * @param {string?} currentVersionKey
     */
    constructor (options, currentVersionKey) {
        if (!options) {
            throw new Error('versions is required')
        }
        if (!Array.isArray(options) || options.length === 0) {
            throw new Error('versions must be not empty array')
        }

        this._validateVersions(options)

        if (currentVersionKey === null || currentVersionKey === undefined) {
            throw new Error('currentVersionKey is required')
        }
        if (!this.versions[currentVersionKey]) {
            throw new Error('invalid currentVersionKey: can\'t find version with this key')
        }
        this.currentVersionKey = currentVersionKey
    }

    /**
     * @typedef CipherManagerResult
     * @property {string} version
     * @property {CipherManagerResultIv} iv
     */

    /**
     * @typedef CipherManagerResultIv
     * @property {string} value
     * @property {BufferEncoding} encoding
     */

    /**
     * If config.versionKey is not provided, currentVersionKey being used
     * @param {string} data
     * @param {Partial<CipherManagerResult>?} config
     * @returns {CipherManagerResult & {encrypted:string}}
     */
    encrypt (data, config = {}) {
        const versionKey = config.version || this.currentVersionKey
        const version = this.versions[versionKey]
        if (!version) {
            throw new Error('Invalid version')
        }

        const { cipher, ivLength, secret } = version
        const iv = config.iv ? Buffer.from(config.iv.value, config.iv.encoding) : crypto.randomBytes(ivLength)
        const ivHex = iv.toString('hex')

        const cipheriv = crypto.createCipheriv(cipher, secret, iv)
        const encrypted = Buffer.concat([cipheriv.update(data), cipheriv.final()])
        const encryptedData = [
            Buffer.from(versionKey).toString('hex'),
            ivHex,
            encrypted.toString('hex'),
        ].join(SEPARATOR)

        return { 
            encrypted: encryptedData,
            iv: { value: ivHex, encoding: 'hex' },
            version: versionKey,
        }
    }

    /** @param {string} encrypted
     *  @returns {CipherManagerResult & {decrypted:string}}
     */
    decrypt (encrypted) {
        let [versionKey, iv, encoded] = encrypted.split(SEPARATOR)
        versionKey = Buffer.from(versionKey, 'hex').toString()

        const version = this.versions[versionKey]
        if (!version) {
            throw new Error(`invalid version ${versionKey}`)
        }

        const decipheriv = crypto.createDecipheriv(version.cipher, version.secret, Buffer.from(iv, 'hex'))
        const decrypted = Buffer.concat([decipheriv.update(Buffer.from(encoded, 'hex')), decipheriv.final()])

        return {
            decrypted: decrypted.toString(),
            iv: { value: iv, encoding: 'hex' },
            version: versionKey,
        }
    }

    _validateVersions (options) {
        const uniqueVersions = new Set()
        for (let i = 0; i < options.length; i++) {
            const { version, cipher, secret } = options[i]
            const position = `options[${i}]`
            if (typeof version !== 'string' || isEmpty(version)) {
                throw new Error(`version must be a non empty string at ${position}.version`)
            }
            if (uniqueVersions.has(version)) {
                throw new Error(`versions must be unique, received duplicate ${version} at ${position}.version`)
            }
            uniqueVersions.add(version)
            const cipherInfo = crypto.getCipherInfo(cipher)
            if (!cipherInfo) {
                throw new Error(`invalid cipher at ${position}.cipher`)
            }
            if (!SUPPORTED_MODES.includes(cipherInfo.mode)) {
                throw new Error(`cipher ${cipher} is not supported right now at ${position}.cipher`)
            }
            if (SUGGESTIONS[cipherInfo.mode]) {
                console.warn(`${SUGGESTIONS[cipherInfo.mode]} at ${position}.cipher`)
            }

            const ivLength = cipherInfo.ivLength || 0
            const keyLength = cipherInfo.keyLength

            if (typeof secret !== 'string' || isEmpty(secret)) {
                throw new Error(`secret must be a non empty string at ${position}.secret`)
            }
            if (secret.length !== keyLength) {
                throw new Error(`secret for cipher ${cipher} must have length ${keyLength}, received ${secret.length}`)
            }
            if (!crypto.getCipherInfo(cipher, { keyLength: secret.length })) {
                throw new Error(`for some reason crypto does not accept ${cipher} with secret of length ${secret.length}, debug why at ${position}`)
            }

            this.versions[version] = {
                secret,
                cipher,
                ivLength,
            }
        }
    }
}

module.exports = {
    CipherManager,
    SUPPORTED_MODES,
}