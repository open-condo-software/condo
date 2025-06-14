const { Text } = require('@open-keystone/fields')
const get = require('lodash/get')
const isNil = require('lodash/isNil')

const CommonInterface = superclass => class extends superclass {
    
    /** @type {EncryptionManager} */
    encryptionManager
    
    constructor () {
        super(...arguments) 
        this.encryptionManager = this.config.encryptionManager
    }

    setupHooks ({ addPreSaveHook }) {

        addPreSaveHook(item => {
            const fieldIsDefined = !isNil(item) && !isNil(item[this.path])
            const fieldIsEncrypted = this.encryptionManager.isEncrypted(get(item, this.path))
            if (fieldIsDefined && !fieldIsEncrypted) {
                item[this.path] = this.encryptionManager.encrypt(item[this.path])
            }
            return item
        })

    }
    
}

class EncryptedTextKnexFieldAdapter extends CommonInterface(Text.adapters.knex) {}
class EncryptedTextMongooseFieldAdapter extends CommonInterface(Text.adapters.mongoose) {}
class EncryptedTextPrismaFieldAdapter extends CommonInterface(Text.adapters.prisma) {}

module.exports = {
    mongoose: EncryptedTextMongooseFieldAdapter,
    knex: EncryptedTextKnexFieldAdapter,
    prisma: EncryptedTextPrismaFieldAdapter,
}