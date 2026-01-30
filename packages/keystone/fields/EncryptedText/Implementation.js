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
                    
                    // Walk info.path back to the root field name
                    let currentPath = info.path
                    while (currentPath && currentPath.prev) {
                        currentPath = currentPath.prev
                    }
                    const rootFieldKey = currentPath ? currentPath.key : null
                    
                    if (rootFieldKey) {
                        // Find the matching selection in the operation's selection set
                        // Check both alias (if present) and name to handle aliased queries
                        const matchingSelection = info.operation.selectionSet.selections.find(
                            selection => {
                                const aliasMatch = selection.alias && selection.alias.value === rootFieldKey
                                const nameMatch = selection.name && selection.name.value === rootFieldKey
                                return aliasMatch || nameMatch
                            }
                        )
                        
                        // Only decrypt if this specific field is a create mutation
                        if (matchingSelection && matchingSelection.name.value.startsWith('create')) {
                            return this.encryptionManager.decrypt(value)
                        }
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