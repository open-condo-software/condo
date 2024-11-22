const crypto = require('crypto')

const isEmpty = require('lodash/isEmpty')
const isNil = require('lodash/isNil')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging/getLogger')

const logger = getLogger('EncryptionManager')

let DEFAULT_CONFIG
let DEFAULT_VERSION_ID

// INVISIBLE / WHITESPACE CHARACTERS
// \u{200B} - ZERO WIDTH SPACE
// \u{034F} - COMBINING GRAPHEME JOINER
// \u{180C} - MONGOLIAN FREE VARIATION SELECTOR TWO
// \u{1D175} - MUSICAL SYMBOL BEGIN TIE
// \u{E003B} - TAG SEMICOLON
// \u{2800} - BRAILLE PATTERN BLANK

// since data is converted in hex, ':' shouldn't be in it
const SEPARATOR = ':'
const ENCRYPTION_PREFIX = ['\u{200B}', '\u{034F}', '\u{180C}', '\u{1D175}', '\u{E003B}', '\u{2800}'].join('')
const SUPPORTED_MODES = ['cbc', 'ctr', 'cfb', 'ofb']
const SUGGESTIONS = {
    'cfb': 'Please, consider using "ctr" or "cbc"',
    'ofb': 'Please, consider using "ctr" or "cbc"',
}

/**
 * Id:version pairs
 * @typedef {Object} EncryptionManagerConfig
 * @type {{[id:string]:EncryptionManagerVersion}}
 */

/**
 * @typedef {Object} EncryptionManagerVersion
 * @property {string} algorithm - crypto algorithm
 * @property {string} secret - secret key
 */

/**
 * Used for versioning secrets for encryption / decryption
 * @example use defaults
 * const manager = new EncryptManager() // use versions from .env DEFAULT_KEYSTONE_SYMMETRIC_ENCRYPTION_CONFIG and encrypt in DEFAULT_KEYSTONE_SYMMETRIC_ENCRYPTION_VERSION_ID
 *
 * @example override version for encryption
 * const manager = new EncryptManager({ encryptionVersionId: 'version id - key of version in default config' })
 *
 * @example provide custom versions
 * const versions = { 'versionId': { algorithm: 'aes-256-cbc', secret: '...' } }
 * const encryptionVersionId = 'versionId'
 * const manager = new EncryptManager({ versions, encryptionVersionId })
 *
 * @example encryption
 * const encryptedData = manager.encrypt('some data') // encrypted using encryptionVersionId from defaults or custom config
 *
 * @example successful decryption
 * // versions, in which these were encrypted presented in EncryptionManager
 * const encryptedWithVersion1 = 'some-encrypted-text'
 * const encryptedWithVersion2 = 'some-encrypted-text2'
 * const decryptedDataFromVersion1 = manager.decrypt(encryptedWithVersion1)
 * const decryptedDataFromVersion2 = manager.decrypt(encryptedWithVersion2)
 *
 * @example unsuccessful decryption
 * const encryptedDataNull = null
 * manager.decrypt(encryptedDataNull) // this throws error. You should not put null / undefined here
 *
 * const encryptedWithVersionWhichNotPresent = 'this-data-was-encrypted-using-version-which-is-not-present-in-Encryption-Manager'
 * const decryptedData = manager.decrypt(encryptedWithVersionWhichNotPresent)
 * expect(decryptedData).toBe(null)
 */
class EncryptionManager {
    
    _encryptionVersionId
    _config = {}

    /**
     * @param config
     * @param {EncryptionManagerConfig?} config.versions - override default versions for encryption and decryption
     * @param {string?} config.encryptionVersionId - add default versions from .env. Defaults to true
     * */
    constructor ({ versions = null, encryptionVersionId  } = {}) {
        if (isNil(versions)) {
            this._initializeDefaults(encryptionVersionId)
        } else {
            this._initializeCustom(versions, encryptionVersionId)
        }
    }

    /**
     * @param {string} data
     * @returns {string}
     */
    encrypt (data) {
        const { algorithm, ivLength, secret } = this._config[this._encryptionVersionId]
        const iv = crypto.randomBytes(ivLength)

        const cipheriv = crypto.createCipheriv(algorithm, secret, iv)
        const encryptedValue = Buffer.concat([cipheriv.update(data), cipheriv.final()])
        return [
            ENCRYPTION_PREFIX,
            Buffer.from(this._encryptionVersionId).toString('hex'),
            encryptedValue.toString('hex'),
            iv.toString('hex'),
        ].join(SEPARATOR)
    }

    /** @param {string} encrypted
     *  @returns {string | null}
     */
    decrypt (encrypted) {
        if (typeof encrypted !== 'string') {
            return null
        }
        const parts = encrypted.split(SEPARATOR)
        if (parts.length < 3) {
            return null
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, versionIdHex, encodedHex, ivHex] = parts
        const versionId = Buffer.from(versionIdHex, 'hex').toString()
        const version = this._config[versionId]
        if (isNil(version)) {
            logger.error({ msg: 'Received version id, which is not present in versions', data: { versionId } })
            return null
        }
        const { algorithm, secret } = version
        const decipheriv = crypto.createDecipheriv(algorithm, secret, Buffer.from(ivHex, 'hex'))
        const decrypted = Buffer.concat([decipheriv.update(Buffer.from(encodedHex, 'hex')), decipheriv.final()])

        return decrypted.toString()
    }

    /**
     * Is given string encrypted with one of versions of this instance. Can not check for secrets and algorithm
     * @param {string} str
     * @param {string?} versionId - validate specific version
     * @returns {boolean}
     */
    isEncrypted (str, versionId) {
        if (typeof str !== 'string') {
            return false
        }
        const parts = str.split(SEPARATOR)
        if (parts.length < 3) {
            return false
        }
        if (parts[0] !== ENCRYPTION_PREFIX) {
            return false
        }
        const decodedFromHexVersion = Buffer.from(parts[1], 'hex').toString()
        if (!isNil(versionId)) {
            return decodedFromHexVersion === versionId
        }
        return !!this._config[decodedFromHexVersion]
    }

    _initializeDefaults (overrideEncryptionVersionId) {
        if (!isNil(DEFAULT_CONFIG) && !isNil(DEFAULT_VERSION_ID)) {
            this._config = DEFAULT_CONFIG
            this._encryptionVersionId = DEFAULT_VERSION_ID
            return
        }

        const defaultVersionsJSON = conf.DEFAULT_KEYSTONE_SYMMETRIC_ENCRYPTION_CONFIG
        if (isNil(defaultVersionsJSON)) {
            throw new Error('env DEFAULT_KEYSTONE_SYMMETRIC_ENCRYPTION_CONFIG is not present')
        }
        const defaultVersions = JSON.parse(defaultVersionsJSON)
        this._encryptionVersionId = isNil(overrideEncryptionVersionId) ?  conf.DEFAULT_KEYSTONE_SYMMETRIC_ENCRYPTION_VERSION_ID : overrideEncryptionVersionId

        this._validateVersions(defaultVersions)
        this._config = this._parseVersions(defaultVersions)
        this._checkAtLeastOneVersionPresent()
        this._checkEncryptionVersionPresent()

        DEFAULT_CONFIG = this._config
        DEFAULT_VERSION_ID = this._encryptionVersionId
    }

    _initializeCustom (versions, encryptionVersionId) {
        if (isNil(versions) || typeof versions !== 'object' || Array.isArray(versions)) {
            throw new Error('Invalid custom versions, received. You should provide object with shape    ' +
            '{[versionId: string]: { algorithm: string, secret: string }}')
        }
        this._encryptionVersionId = encryptionVersionId
        this._validateVersions(versions)
        this._config = this._parseVersions(versions)
        this._checkAtLeastOneVersionPresent()
        this._checkEncryptionVersionPresent()
    }

    _checkAtLeastOneVersionPresent () {
        const atLeastOneVersionPresent = Object.keys(this._config).length > 0
        if (!atLeastOneVersionPresent) {
            throw new Error('Zero versions were provided. Add version in env.DEFAULT_KEYSTONE_SYMMETRIC_ENCRYPTION_CONFIG or provide in constructor')
        }
    }

    _checkEncryptionVersionPresent () {
        if (isNil(this._encryptionVersionId)) {
            throw new Error(`Invalid encryption version id, received: ${this._encryptionVersionId}. You must add it in 
            env.DEFAULT_KEYSTONE_SYMMETRIC_ENCRYPTION_VERSION_ID or provide in constructor`)
        }

        if (isNil(this._config[this._encryptionVersionId])) {
            throw new Error(`Invalid encryption version id, received: ${this._encryptionVersionId}.
            Version id not found in provided versions`)
        }
    }

    _parseVersions (versions) {
        const parsedConfig = {}
        for (const versionId in versions) {
            const { algorithm, secret } = versions[versionId]
            const { ivLength } = crypto.getCipherInfo(algorithm)
            parsedConfig[versionId] = {
                algorithm,
                secret,
                ivLength: ivLength || 0,
            }
        }
        return parsedConfig
    }

    _validateVersions (versions) {
        for (const versionId in versions) {
            if (versionId.includes(SEPARATOR)) {
                throw new Error(`You should not put "${SEPARATOR}" in version id (key in object of versions), received ${versionId}`)
            }
            if (versionId.length === 0) {
                throw new Error('Invalid version id. Empty string is forbidden')
            }

            const { algorithm, secret } = versions[versionId]
            const cipherInfo = crypto.getCipherInfo(algorithm)
            if (!cipherInfo) {
                throw new Error(`Invalid algorithm at ${versionId}.algorithm`)
            }
            if (!SUPPORTED_MODES.includes(cipherInfo.mode)) {
                throw new Error(`Algorithm ${algorithm} is not supported right now at ${versionId}.algorithm`)
            }
            if (SUGGESTIONS[cipherInfo.mode]) {
                console.warn(`${SUGGESTIONS[cipherInfo.mode]} at ${versionId}.algorithm`)
            }
            
            const keyLength = cipherInfo.keyLength

            if (typeof secret !== 'string' || isEmpty(secret)) {
                throw new Error(`Secret must be a non empty string at ${versionId}.secret`)
            }
            if (secret.length !== keyLength) {
                throw new Error(`Secret for algorithm ${algorithm} must have length ${keyLength}, received ${secret.length} at ${versionId}.secret`)
            }
            if (!crypto.getCipherInfo(algorithm, { keyLength: secret.length })) {
                throw new Error(`For some reason crypto does not accept ${algorithm} with secret of length ${secret.length}, debug why at ${versionId}.secret`)
            }
        }
    }
}

module.exports = {
    EncryptionManager,
    SUPPORTED_MODES,
    ENCRYPTION_PREFIX,
}