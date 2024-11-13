const { Text } = require('@keystonejs/fields')
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
            if (!isNil(item) && !isNil(item[this.path])) {
                item[this.path] = this.encryptionManager.encrypt(item[this.path])
            }
            return item
        })

    }
    
}

class SymmetricEncryptedTextKnexFieldAdapter extends CommonInterface(Text.adapters.knex) {}
class SymmetricEncryptedTextMongooseFieldAdapter extends CommonInterface(Text.adapters.mongoose) {}
class SymmetricEncryptedTextPrismaFieldAdapter extends CommonInterface(Text.adapters.prisma) {}

module.exports = {
    mongoose: SymmetricEncryptedTextMongooseFieldAdapter,
    knex: SymmetricEncryptedTextKnexFieldAdapter,
    prisma: SymmetricEncryptedTextPrismaFieldAdapter,
}