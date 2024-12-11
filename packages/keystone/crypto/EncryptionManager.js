const crypto = require('crypto')

const dumbPasswords = require('dumb-passwords')
const isEmpty = require('lodash/isEmpty')
const isNil = require('lodash/isNil')

const conf = require('@open-condo/config')

const { compressors } = require('./compressors')
const { EncryptionVersion } = require('./EncryptionVersion')
const { keyDerivers } = require('./keyDerivers')

let DEFAULT_CONFIG
let DEFAULT_VERSION_ID

// INVISIBLE / WHITESPACE CHARACTERS
// \u{200B} - ZERO WIDTH SPACE
// \u{034F} - COMBINING GRAPHEME JOINER
// \u{180C} - MONGOLIAN FREE VARIATION SELECTOR TWO
// \u{1D175} - MUSICAL SYMBOL BEGIN TIE
// \u{E003B} - TAG SEMICOLON
// \u{2800} - BRAILLE PATTERN BLANK

// ':' should not be presented in version id or encryption prefix
const SEPARATOR = ':'
const ENCRYPTION_PREFIX = ['\u{200B}', '\u{034F}', '\u{180C}', '\u{1D175}', '\u{E003B}', '\u{2800}'].join('')
const SUPPORTED_MODES = ['cbc', 'ctr', 'gcm']
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
 * @property {string} compressor
 * @property {string} keyDeriver
 */

/**
 * Used for versioning secrets for encryption / decryption
 * @example use defaults
 * const manager = new EncryptManager() // use versions from .env DATA_ENCRYPTION_CONFIG and encrypt in DATA_ENCRYPTION_VERSION_ID
 *
 * @example override version for encryption
 * const manager = new EncryptManager({ encryptionVersionId: 'version id - key of version in default config' })
 *
 * @example provide custom versions
 * const versions = { 'versionId': { algorithm: 'aes-256-cbc', secret: '...', compressor: '...', keyDeriver: '...' } }
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
 * expect(() => manager.decrypt(encryptedWithVersionWhichNotPresent))).toThrow()
 */
class EncryptionManager {
    
    _encryptionVersionId
    /** @type {Record<string, EncryptionVersion>} */
    _config = {}

    /**
     * @param config
     * @param {EncryptionManagerConfig?} config.versions - override default versions for encryption and decryption
     * @param {string?} config.encryptionVersionId - override default version to encrypt data with
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
        const version = this._config[this._encryptionVersionId]
        return [
            ENCRYPTION_PREFIX,
            this._encryptionVersionId,
            version.encrypt(data),
        ].join(SEPARATOR)
    }

    /** @param {string} encrypted
     *  @returns {string | null}
     */
    decrypt (encrypted) {
        if (typeof encrypted !== 'string') {
            throw new Error(`Invalid encrypted data, expected of type "string", received ${typeof encrypted}`)
        }
        const parts = encrypted.split(SEPARATOR)
        if (parts.length < 3) {
            throw new Error('Invalid format of encrypted data')
        }

        const [encryptionPrefix, versionId, encryptedPayload] = parts
        if (encryptionPrefix !== ENCRYPTION_PREFIX) {
            throw new Error('Invalid encrypted data. It was not encrypted with EncryptionManager')
        }
        const version = this._config[versionId]
        if (isNil(version)) {
            throw new Error('Invalid encrypted data. Versions id is not present in EncryptionManager')
        }
        return version.decrypt(encryptedPayload)
    }

    /**
     * Is given string encrypted with one of versions of this instance. Can not check for secrets and algorithm
     * @param {string} str
     * @returns {boolean}
     */
    isEncrypted (str) {
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
        return !!this._config[parts[1]]
    }

    _initializeDefaults (overrideEncryptionVersionId) {
        if (!isNil(DEFAULT_CONFIG) && !isNil(DEFAULT_VERSION_ID)) {
            this._config = DEFAULT_CONFIG
            this._encryptionVersionId = DEFAULT_VERSION_ID
            return
        }

        // Skip .env parsing in build time, when .env is not present
        if (conf.PHASE === 'build') {
            return
        }

        const defaultVersionsJSON = conf.DATA_ENCRYPTION_CONFIG
        if (isNil(defaultVersionsJSON)) {
            throw new Error('env DATA_ENCRYPTION_CONFIG is not present')
        }
        const defaultVersions = JSON.parse(defaultVersionsJSON)
        this._encryptionVersionId = isNil(overrideEncryptionVersionId) ?  conf.DATA_ENCRYPTION_VERSION_ID : overrideEncryptionVersionId

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
            throw new Error('Zero versions were provided. Add version in env.DATA_ENCRYPTION_CONFIG or provide in constructor')
        }
    }

    _checkEncryptionVersionPresent () {
        if (isNil(this._encryptionVersionId)) {
            throw new Error(`Invalid encryption version id, received: ${this._encryptionVersionId}. You must add it in 
            env.DATA_ENCRYPTION_VERSION_ID or provide in constructor`)
        }

        if (isNil(this._config[this._encryptionVersionId])) {
            throw new Error(`Invalid encryption version id, received: ${this._encryptionVersionId}.
            Version id not found in provided versions`)
        }
    }

    _parseVersions (versions) {
        const parsedConfig = {}
        for (const versionId in versions) {
            const { algorithm, secret, keyDeriver = 'noop', compressor = 'noop' } = versions[versionId]
            parsedConfig[versionId] = new EncryptionVersion({
                id: versionId,
                algorithm,
                secret,
                compressor,
                keyDeriver,
            })
        }
        return parsedConfig
    }

    _validateVersions (versions) {
        for (const versionId in versions) {
            if (versionId.length === 0) {
                throw new Error('Invalid version id. Empty string is forbidden')
            }
            if (versionId.includes(SEPARATOR)) {
                throw new Error(`${SEPARATOR} is forbidden to use in version id at ${versionId}`)
            }

            const {
                algorithm,
                secret,
                keyDeriver = 'noop',
                compressor = 'noop',
            } = versions[versionId]
            const cipherInfo = crypto.getCipherInfo(algorithm)
            if (!cipherInfo) {
                throw new Error(`Invalid algorithm at ${versionId}.algorithm`)
            }
            if (!SUPPORTED_MODES.includes(cipherInfo.mode)) {
                if (SUGGESTIONS[cipherInfo.mode]) {
                    throw new Error(`${SUGGESTIONS[cipherInfo.mode]} at ${versionId}.algorithm`)
                }
                throw new Error(`Algorithm ${algorithm} is not supported right now at ${versionId}.algorithm`)
            }

            const keyLength = cipherInfo.keyLength
            if (secret.length < keyLength) {
                throw new Error(`Invalid secret key length for ${algorithm} with secret of length ${secret.length}, required at least ${keyLength} at ${versionId}.secret`)
            }

            const secretIsStringOrBuffer = typeof secret === 'string' || secret instanceof Buffer
            if (!secretIsStringOrBuffer || isEmpty(secret)) {
                throw new Error(`Secret must be a non empty string or buffer at ${versionId}.secret`)
            }
            if (dumbPasswords.check(secret.toString())) {
                throw new Error(`Common and frequently-used passwords are not allowed at ${versionId}.secret`)
            }

            if (!compressors[compressor]) {
                throw new Error(`Invalid compressor ${compressor} at ${versionId}.compressor. Register it with "registerCompressor" or use another`)
            }
            if (!keyDerivers[keyDeriver]) {
                throw new Error(`Invalid key deriver ${keyDeriver} at ${versionId}.keyDeriver. Register it with "registerKeyDeriver" or use another`)
            }
        }
    }
}

module.exports = {
    EncryptionManager,
}