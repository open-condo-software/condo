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

    gqlOutputFieldResolvers () {
        return {
            [this.path]: (item, args, context, info) => {
                const value = item[this.path]
                
                // If returnPlainTextOnCreate is enabled and this is a create mutation,
                // return the decrypted value. Keystone reads from DB after write,
                // so we detect create by checking if the parent operation is a create mutation
                if (this.encryptionManager.returnPlainTextOnCreate
                    && info
                    && info.operation
                    && info.operation.operation === 'mutation'
                    && info.operation.selectionSet
                    && this.encryptionManager.isEncrypted(value)) {
                    // Check if this is a create mutation (starts with 'create')
                    const mutationName = info.operation.selectionSet.selections[0]?.name?.value || ''
                    if (mutationName.startsWith('create')) {
                        return this.encryptionManager.decrypt(value)
                    }
                }
                
                return value
            },
        }
    }

}

module.exports = {
    EncryptedTextImplementation,
}