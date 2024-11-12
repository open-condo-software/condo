const { Text } = require('@keystonejs/fields')
const isNil = require('lodash/isNil')
const set = require('lodash/set')

const { CipherManager } = require('@open-condo/keystone/cipher')

/** @type {DecryptPlaces} */
const DEFAULT_DECRYPT_PLACES = {
    existingItem: false,
    updatedItem: false,
}

const SYMMETRIC_ENCRYPTED_TEXT_ENCRYPTED_VALUE = Symbol('SYMMETRIC_ENCRYPTED_TEXT_ENCRYPTED_VALUE')

/**
 * @param item
 * @param {string} fieldPath
 * @param {string} encrypted
 * @private
 */
function saveEncryptedValue (item, fieldPath, encrypted) {
    const previouslySaved = item[SYMMETRIC_ENCRYPTED_TEXT_ENCRYPTED_VALUE] || {}
    previouslySaved[fieldPath] = encrypted
    item[SYMMETRIC_ENCRYPTED_TEXT_ENCRYPTED_VALUE] = previouslySaved
}

/**
 * @param item
 * @param {string} fieldPath
 * @returns {string | undefined}
 */
function getEncryptedValue (item, fieldPath) {
    const previouslySaved = item[SYMMETRIC_ENCRYPTED_TEXT_ENCRYPTED_VALUE] || {}
    return previouslySaved[fieldPath]
}

/**
 * @typedef CipherConfig
 * @type {{
 *      cipherManager?: CipherManager,
 *      versions?: CipherManagerOptions,
 *      currentVersionKey?: string,
 *     }}
 */

/**
 * @typedef DecryptPlaces
 * @type {
 *     boolean | {
 *             existingItem?: boolean,
 *             updatedItem?: boolean,
 *         }
 * }
 */


function _parseDecryptPlacesDeep (errorStart, setting, defaultSettings) {
    if (typeof setting === 'boolean') {
        return Object.keys(defaultSettings).reduce((result, key) => {
            result[key] = typeof defaultSettings[key] === 'object'
                ? _parseDecryptPlacesDeep(errorStart + `."${key}"`, setting, defaultSettings[key])
                : setting
            return result
        }, {})
    }

    if (isNil(setting)) {
        return defaultSettings
    }

    const isNotObject = typeof setting !== 'object' || Array.isArray(setting)
    if (typeof setting !== 'boolean' && isNotObject) {
        throw new TypeError(
            `${errorStart} - must be a boolean or object`
        )
    }

    return Object.keys(defaultSettings).reduce((result, key) => {
        const defaultValue = defaultSettings[key]
        const settingValue = setting[key]

        if (typeof defaultValue === 'object') {
            result[key] = _parseDecryptPlacesDeep(errorStart + `."${key}"`, settingValue, defaultValue)
        } else if (isNil(settingValue) || typeof settingValue === 'boolean') {
            result[key] = !!settingValue
        } else {
            throw new TypeError(`${errorStart}."${key}" - must be a boolean, received ${typeof settingValue}`)
        }

        return result
    }, {})
}

/**
 * @param {string} errorStart
 * @param {CipherConfig?} cipherConfig
 * @returns {CipherManager}
 * @private
 * */
function _getCipherManager (errorStart, cipherConfig) {

    if (!cipherConfig) {
        return CipherManager.new()
    }

    if (cipherConfig.cipherManager) {
        if (cipherConfig.versions) {
            throw new Error(`${errorStart} - do not put "cipherManager" and "versions" together. Use one of them`)
        }
        if (!(cipherConfig.cipherManager instanceof CipherManager)) {
            throw new TypeError(`${errorStart} - you should put CipherManager instance in "cipherManager", received`, cipherConfig.cipherManager)
        }

        if (!Object.keys(cipherConfig.cipherManager._versions).length) {
            throw new Error(`${errorStart} - you should not pass CipherManager with empty versions`)
        }

        return cipherConfig.cipherManager
    }

    if (cipherConfig.versions) {
        if (!Array.isArray(cipherConfig.versions)) {
            throw new TypeError(`${errorStart} - versions must be array, received `, cipherConfig.versions)
        }

        return CipherManager.new({ options: cipherConfig.versions, cipherManager: cipherConfig.currentVersionKey })
    }

    throw new TypeError(`${errorStart} - you provided empty cipherConfig. You should put versions, cipherManager, or remove this option`)
}

function _getErrorStart (listKey, path) { return `${listKey}.${path}: SymmetricEncryptedText field` }


class SymmetricEncryptedTextImplementation extends Text.implementation {

    /** @type {CipherManager} */
    cipherManager
    /** @type {DecryptPlaces} */
    decryptPlaces

    /**
     * @param {string} path
     * @param {{
     *     cipherConfig: CipherConfig?,
     *     decryptInHooks: DecryptPlaces?,
     * }} options
     * @param {string} listKey
     */
    constructor (path, options = {}, { listKey }) {
        const errorStart = _getErrorStart(listKey, path)
        const cipherManager = _getCipherManager(errorStart, options.cipherConfig)
        const decryptPlaces = _parseDecryptPlacesDeep(errorStart + ' "decrypt"', options.decryptPlaces, DEFAULT_DECRYPT_PLACES)

        set(options, 'cipherConfig.cipherManager', cipherManager)

        super(...arguments)

        this.cipherManager = cipherManager
        this.decryptPlaces = decryptPlaces
    }

    // Return encrypted field in response
    gqlOutputFieldResolvers () {
        return {
            [this.path]: (item, _, context, { operation: { operation } }) => {
                if (isNil(item[this.path])) {
                    return item[this.path]
                }

                const isEncrypted = operation === 'query' ? true : this.decryptPlaces.updatedItem
                if (isEncrypted) {
                    return item[this.path]
                }
                return getEncryptedValue(item, this.path)
            },
        }
    }

    // Decrypt field from existingItem
    async resolveInput ({ existingItem }) {
        const resolveInputSuper = await super.resolveInput(...arguments)
        if (this.decryptPlaces.existingItem) {
            this._decryptField(existingItem)
        }
        return resolveInputSuper
    }

    // Decrypt field from updatedItem
    async afterChange ({ updatedItem }) {
        await super.afterChange(...arguments)
        if (this.decryptPlaces.updatedItem) {
            this._decryptField(updatedItem)
        }
    }

    _decryptField (item) {
        if (!isNil(item) && !isNil(item[this.path])) {
            const { decrypted } = this.cipherManager.decrypt(item[this.path])
            saveEncryptedValue(item, this.path, item[this.path])
            item[this.path] = decrypted
        }
        return item
    }

}

module.exports = {
    SymmetricEncryptedTextImplementation,
}