const { Text } = require('@keystonejs/fields')

const { CipherManager } = require('@open-condo/keystone/cipher')
const { saveDecryptInfo, getDecryptInfo } = require('@open-condo/keystone/fields/SymmetricEncryptedText/utils/decryptInfo')

class SymmetricEncryptedTextImplementation extends Text.implementation {

    /** @type {CipherManager} */
    cipherManager

    constructor (path, options = {}) {
        super(...arguments)

        const errorStart = `${this.listKey}.${path}: SymmetricEncryptedText field`
        
        if (!options.cipherManager || !(options.cipherManager instanceof CipherManager)) {
            throw new Error(`${errorStart} cipherManager with instance of CipherManager class required`)
        }
        this.cipherManager = options.cipherManager
    }

    gqlOutputFieldResolvers () {
        return {
            [this.path]: (item, _, context, { operation: { operation } }) => {
                const field = item[this.path]
                // query operation does not trigger hooks, so data will stay encrypted
                if (field !== null && field !== undefined && operation !== 'query') {
                    const { encrypted } = this.cipherManager.encrypt(field, getDecryptInfo(item, this.path))
                    return encrypted
                }
                return field
            },
        }
    }

    _decryptField (item) {
        if (item !== null && item !== undefined && item[this.path] !== null && item[this.path] !== undefined) {
            const { decrypted, ...decryptInfo } = this.cipherManager.decrypt(item[this.path])
            saveDecryptInfo(item, this.path, decryptInfo)
            item[this.path] = decrypted
        }
        return item
    }

    // Decrypt field from existingItem
    async resolveInput () {
        const resolveInputSuper = await super.resolveInput(...arguments)
        const { existingItem } = arguments[0]
        this._decryptField(existingItem)
        return resolveInputSuper
    }

    // Decrypt field from updatedItem
    async afterChange () {
        await super.afterChange(...arguments)
        const { updatedItem } = arguments[0]
        this._decryptField(updatedItem)
    }

}

module.exports = {
    SymmetricEncryptedTextImplementation,
}