const crypto = require('crypto')

const isEmpty = require('lodash/isEmpty')
const isNil = require('lodash/isNil')

const conf = require('@open-condo/config')


// since data is converted in hex, ':' shouldn't be in it
const SEPARATOR = ':'
const SUPPORTED_MODES = ['cbc', 'ctr', 'cfb', 'ofb', 'ecb']
const SUGGESTIONS = {
    'ecb': 'WARNING! Don\'t use "ecb" in real application as it is insecure!',
    'cfb': 'Please, consider using "ctr" or "cbc"',
    'ofb': 'Please, consider using "ctr" or "cbc"',
}

/**
 * @typedef CipherManagerOptions
 * @type {Array<{version: string, cipher: string, secret: string}>}
 */

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
 * Used for versioning secrets for encryption / decryption
 * @example
 * const managerWithDefaults = CipherManager.default({ options: myVersions || undefined, currentVersionKey: 'overrideVersionKey' | undefined })
 *
 * const managerWithoutDefaults = CipherManager.new({ options: myVersions, currentVersionKey: 'overrideVersionKey' | undefined })
 *
 * const managerNotUsable = new CipherManager()
 */
class CipherManager {

    #defaultConfigEnvKey = 'DEFAULT_KEYSTONE_CIPHER_MANAGER_CONFIG'

    /** @type {{[version: string]: {cipher: string, secret: string, ivLength: number}}} */
    _versions = {}
    _currentVersionKey

    /**
     * Creates new instance with pre-filled default values from .env DEFAULT_KEYSTONE_CIPHER_MANAGER_CONFIG
     * @param {{
     *     options?: CipherManagerOptions,
     *     currentVersionKey?: string,
     * }} config
     * @returns {CipherManager}
     */
    static new (config = {}) {
        const manager = new this()
        const defaultOptions = JSON.parse(conf[manager.#defaultConfigEnvKey])
        const options = config.options ? [...defaultOptions, ...config.options] : defaultOptions
        manager.#init(options, config.currentVersionKey)
        return manager
    }

    /**
     * Same as CipherManager.new(), but does not pre-fill anything
     * @param {{
     *     options: Array<{version: string, cipher: string, secret: string}>,
     *     currentVersionKey?: string,
     * }} config
     * @returns {CipherManager}
     */
    static custom (config) {
        const manager = new this()
        manager.#init(config.options, config.currentVersionKey)
        return manager
    }

    /**
     * @param {Array<{version: string, cipher: string, secret: string}>} options
     * @param {string?} currentVersionKey
     */
    #init (options, currentVersionKey) {
        if (!options) {
            throw new Error('versions is required')
        }
        if (!Array.isArray(options) || options.length === 0) {
            throw new Error('versions must be not empty array')
        }

        this._validateVersions(options)
        const versionsData = this._parseVersions(options)
        if (!isNil(currentVersionKey) && isNil(versionsData.versions.find(ver => ver.version === currentVersionKey))) {
            throw new Error(`invalid currentVersionKey ${currentVersionKey}`)
        }
        this._versions = versionsData.versions
        this._currentVersionKey = currentVersionKey || versionsData.currentVersionKey
    }

    /**
     * If config.version is not provided, currentVersionKey being used
     * @param {string} data
     * @param {Partial<CipherManagerResult>?} config
     * @returns {CipherManagerResult & {encrypted:string}}
     */
    encrypt (data, config = {}) {
        const versionKey = config.version || this._currentVersionKey
        const version = this._versions[versionKey]
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
            encrypted.toString('hex'),
            ivHex,
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
        let [versionKey, encoded, iv] = encrypted.split(SEPARATOR)
        versionKey = Buffer.from(versionKey, 'hex').toString()

        const version = this._versions[versionKey]
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

    _parseVersions (options) {
        const versions = {}
        for (let i = 0; i < options.length; i++) {
            const { version, secret, cipher } = options[i]
            const { ivLength } = crypto.getCipherInfo(cipher)
            versions[version] = {
                secret,
                cipher,
                ivLength: ivLength || 0,
            }
        }

        return {
            versions,
            currentVersionKey: options[options.length - 1].version,
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
        }
    }
}

module.exports = {
    CipherManager,
    SUPPORTED_MODES,
}