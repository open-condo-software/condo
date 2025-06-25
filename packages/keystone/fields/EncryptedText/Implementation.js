const { Text } = require('@open-keystone/fields')
const isNil = require('lodash/isNil')
const set = require('lodash/set')

const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager')

/**
 * @param {string} errorStart
 * @param {{encryptionManager?:EncryptionManager}} options
 * @returns {EncryptionManager}
 * @private
 * */
function _getEncryptionManager (errorStart, options) {
    if (isNil(options.encryptionManager)) {
        return new EncryptionManager()
    }
    
    const manager = options.encryptionManager
    if (!(manager instanceof EncryptionManager)) {
        throw new TypeError(`${errorStart} - "encryptionManager" should be instance of EncryptionManager`)
    }

    return manager
}

function _getErrorStart (listKey, path) { return `${listKey}.${path}: EncryptedText field` }


class EncryptedTextImplementation extends Text.implementation {

    /** @type {EncryptionManager} */
    encryptionManager

    /**
     * @param {string} path
     * @param {{
     *     encryptionManager?: EncryptionManager,
     * }} options
     * @param {string} listKey
     */
    constructor (path, options = {}, { listKey }) {
        // provide encryptionManager in options for fieldAdapter for database
        const errorStart = _getErrorStart(listKey, path)
        const encryptionManager = _getEncryptionManager(errorStart, options)
        set(options, 'encryptionManager', encryptionManager)

        super(...arguments)

        this.encryptionManager = encryptionManager
    }

}

module.exports = {
    EncryptedTextImplementation,
}