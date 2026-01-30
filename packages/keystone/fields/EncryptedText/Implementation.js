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
        this.listKey = listKey
        
        // Only register afterChange hook if returnPlainTextOnCreate is enabled
        // to avoid unnecessary overhead for regular encrypted fields
        if (this.encryptionManager.returnPlainTextOnCreate) {
            this._needsOperationTracking = true
        }
    }

    async afterChange ({ updatedItem, existingItem, operation, context, listKey }) {
        // Only store operation if this field needs it for returnPlainTextOnCreate
        if (!this._needsOperationTracking) return
        
        // Store operation type in context for use in gqlOutputFieldResolvers
        // Use per-field key to avoid collisions when a model has multiple EncryptedText fields
        if (!context._encryptedTextOperations) {
            context._encryptedTextOperations = {}
        }
        const key = `${listKey}:${updatedItem.id}:${this.path}`
        context._encryptedTextOperations[key] = operation
    }

    gqlOutputFieldResolvers () {
        return {
            [this.path]: (item, args, context, info) => {
                const value = item[this.path]
                
                // If returnPlainTextOnCreate is enabled and this is a create mutation,
                // return the decrypted value
                if (this.encryptionManager.returnPlainTextOnCreate
                    && this.encryptionManager.isEncrypted(value)
                    && context._encryptedTextOperations) {
                    
                    // Check if this item was just created by looking up the operation in context
                    // Use per-field key to support multiple EncryptedText fields in the same model
                    const itemId = item.id
                    const fieldPath = this.path
                    const operation = context._encryptedTextOperations[`${this.listKey}:${itemId}:${fieldPath}`]
                    
                    if (operation === 'create') {
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
