const crypto = require('crypto')

const get = require('lodash/get')
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
 * @typedef {Object} EncryptionManagerOption
 * @property {string} id - version unique key
 * @property {string} algorithm - crypto algorithm
 * @property {string} secret - secret key
 */

/**
 * @typedef EncryptionVersion
 * @type {{id: string, algorithm: string, secret: string, ivLength: number}}
 */


/**
 * Used for versioning secrets for encryption / decryption
 * @example
 * const manager = new EncryptManager() // use versions from .env DEFAULT_KEYSTONE_ENCRYPTION_CONFIG
 * const manager = new EncryptManager({ customConfig: [{ id: '22', algorithm: 'aes-256-cbc', secret: <...> }] }) // encode with you version, decode from your and default versions
 * const manager = new EncryptManager({ customConfig: [...], useDefaultConfig: false }) // do not decode values, encrypted with default versions
 * const manager = new EncryptManager({ customConfig: [...], useDefaultAsCurrent: true }) // fallback, if you decided to return to default versions, it will simplify process of re encrypting data
 *
 * const encryptedData = manager.encrypt('some data')
 * const decryptedData = manager.decrypt(encryptedData)
 * if (decryptedData === null) {
 *     // it means one of two things:
 *     // 1. data itself was null
 *     // 2. version, with which data was encrypted is not present in .env or customConfig. You should remove old versions only after
 *     // re encrypting all data, so this situation won't happen
 * } else {
 *     expect(decryptedData).toEqual('some data')
 * }
 */
class EncryptionManager {

    #defaultConfigEnvKey = 'DEFAULT_KEYSTONE_ENCRYPTION_CONFIG'

    /** @type {{[id: string]: EncryptionVersion}} */
    _defaultConfig = {}
    /** @type {{[id: string]: EncryptionVersion}} */
    _customConfig = {}
    _currentVersionId

    /**
     * @param config
     * @param {EncryptionManagerOption[]?} config.customConfig - use your own secret versions. Defaults to []
     * @param {boolean=true} config.useDefaultConfig - add default versions from .env. Defaults to true
     * @param {boolean=false} config.useDefaultAsCurrent - encrypt data with your versions or default ones. Defaults to false
     * */
    constructor ({ customConfig = [], useDefaultConfig = true, useDefaultAsCurrent = false  } = {}) {
        const defaultConfig = useDefaultConfig ? JSON.parse(conf[this.#defaultConfigEnvKey] || '[]') : []
        this._defaultConfig = this._parseVersions(defaultConfig)
        this._customConfig = this._parseVersions(customConfig)
        this._checkDuplicatesBetweenDefaultAndCustomVersions(useDefaultConfig)
        this._checkAtLeastOneVersionPresent()
        if (useDefaultAsCurrent && !useDefaultConfig) {
            throw new Error('You can\'t set currentVersion from default config, and not use one at the same time. Provide useDefaultConfig: true')
        }
        this._currentVersionId = this._getCurrentVersionId(defaultConfig, customConfig, useDefaultAsCurrent)
    }

    /**
     * @param {string} data
     * @returns {string}
     */
    encrypt (data) {
        const { algorithm, ivLength, secret } = this._getConfigById(this._currentVersionId)
        const iv = crypto.randomBytes(ivLength)

        const cipheriv = crypto.createCipheriv(algorithm, secret, iv)
        const encryptedValue = Buffer.concat([cipheriv.update(data), cipheriv.final()])
        return [
            Buffer.from(this._currentVersionId).toString('hex'),
            encryptedValue.toString('hex'),
            iv.toString('hex'),
        ].join(SEPARATOR)

    }

    /** @param {string} encrypted
     *  @returns {string | null}
     */
    decrypt (encrypted) {
        let [versionIdHex, encodedHex, ivHex] = encrypted.split(SEPARATOR)
        const versionId = Buffer.from(versionIdHex, 'hex').toString()
        const version = this._getConfigById(versionId)
        if (isNil(version)) {
            return null
        }
        const { algorithm, secret } = version
        const decipheriv = crypto.createDecipheriv(algorithm, secret, Buffer.from(ivHex, 'hex'))
        const decrypted = Buffer.concat([decipheriv.update(Buffer.from(encodedHex, 'hex')), decipheriv.final()])

        return decrypted.toString()
    }

    _getConfigById (id) {
        return this._defaultConfig[id] || this._customConfig[id]
    }

    _getCurrentVersionId (defaultConfig, customConfig, useDefaultAsCurrent) {
        const lastDefaultVersionId = get(defaultConfig.pop(), 'id')
        const lastCustomVersionId = get(customConfig.pop(), 'id')
        let currentVersionId
        if (useDefaultAsCurrent) {
            currentVersionId = lastDefaultVersionId
            if (!currentVersionId) {
                throw new Error(`You want to set currentVersion from default config, but it is not present. Check .env ${this.#defaultConfigEnvKey}}`)
            }
        } else {
            currentVersionId = lastCustomVersionId || lastDefaultVersionId
            if (!currentVersionId) {
                throw new Error(`You want to set currentVersion from active config, but it is not present.
                 Check .env ${this.#defaultConfigEnvKey}} or validate that you provided non empty versions in customConfig`)
            }
        }
        return currentVersionId
    }

    _checkAtLeastOneVersionPresent () {
        const atLeastOneVersionPresent = [this._defaultConfig, this._customConfig]
            .map(versions => Object.keys(versions))
            .some(versionsIds => versionsIds.length)
        if (!atLeastOneVersionPresent) {
            throw new Error('Zero versions were provided. Remove { useDefaultConfig: false } or provide customConfig')
        }
    }

    _checkDuplicatesBetweenDefaultAndCustomVersions (useDefaultVersion) {
        const checkEnv = `.env ${this.#defaultConfigEnvKey}`
        const checkArgs = 'customConfig parameter'
        let placesToCheck = []
        if (useDefaultVersion) {
            placesToCheck.push(checkEnv)
        }
        if (Object.keys(this._customConfig).length) {
            placesToCheck.push(checkArgs)
        }
        placesToCheck = placesToCheck.join(', ')

        for (const id in this._defaultConfig) {
            if (this._customConfig.hasOwnProperty(id)) {
                throw new Error(`Duplicate version ids are not allowed. Duplicate key: ${id}. Check ${placesToCheck}`)
            }
        }

        for (const id in this._customConfig) {
            if (this._defaultConfig.hasOwnProperty(id)) {
                throw new Error(`Duplicate version ids are not allowed. Duplicate key: ${id}. Check ${placesToCheck}`)
            }
        }
    }

    _parseVersions (config) {
        this._validateVersions(config)
        return config.reduce((versions, curVersion) => {
            const { id, algorithm, secret } = curVersion
            const { ivLength } = crypto.getCipherInfo(algorithm)
            versions[id] = {
                id,
                algorithm,
                secret,
                ivLength: ivLength || 0,
            }
            return versions
        }, {})
    }

    _validateVersions (versions) {
        const uniqueVersions = new Set()
        for (let i = 0; i < versions.length; i++) {
            const { id, algorithm, secret } = versions[i]
            const position = `options[${i}]`
            if (typeof id !== 'string' || isEmpty(id)) {
                throw new Error(`Version must be a non empty string at ${position}.id`)
            }
            if (uniqueVersions.has(id)) {
                throw new Error(`Versions must be unique, received duplicate ${id} at ${position}.id`)
            }
            uniqueVersions.add(id)
            const cipherInfo = crypto.getCipherInfo(algorithm)
            if (!cipherInfo) {
                throw new Error(`Invalid algorithm at ${position}.algorithm`)
            }
            if (!SUPPORTED_MODES.includes(cipherInfo.mode)) {
                throw new Error(`Algorithm ${algorithm} is not supported right now at ${position}.algorithm`)
            }
            if (SUGGESTIONS[cipherInfo.mode]) {
                console.warn(`${SUGGESTIONS[cipherInfo.mode]} at ${position}.algorithm`)
            }

            const keyLength = cipherInfo.keyLength

            if (typeof secret !== 'string' || isEmpty(secret)) {
                throw new Error(`Secret must be a non empty string at ${position}.secret`)
            }
            if (secret.length !== keyLength) {
                throw new Error(`Secret for algorithm ${algorithm} must have length ${keyLength}, received ${secret.length}`)
            }
            if (!crypto.getCipherInfo(algorithm, { keyLength: secret.length })) {
                throw new Error(`For some reason crypto does not accept ${algorithm} with secret of length ${secret.length}, debug why at ${position}`)
            }
        }
    }
}

module.exports = {
    EncryptionManager,
    SUPPORTED_MODES,
}