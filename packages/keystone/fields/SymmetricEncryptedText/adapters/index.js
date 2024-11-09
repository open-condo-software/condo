const { Text } = require('@keystonejs/fields')

const { RegexplessKnexFieldAdapter } = require('@open-condo/keystone/fields/utils/RegexplessKnexFieldAdapter')

const CommonInterface = superclass => class extends superclass {
    
    /** @type {CipherManager} */
    cipherManager
    
    constructor () {
        super(...arguments) 
        this.cipherManager = this.config.cipherManager
    }

    setupHooks ({ addPreSaveHook }) {

        addPreSaveHook(item => {
            if (item[this.path] !== null && item[this.path] !== undefined) {
                const { encrypted } = this.cipherManager.encrypt(item[this.path])
                item[this.path] = encrypted
            }
            return item
        })

    }
    
}

class SymmetricEncryptedTextKnexFieldAdapter extends CommonInterface(RegexplessKnexFieldAdapter) {}
class SymmetricEncryptedTextMongooseFieldAdapter extends CommonInterface(Text.adapters.mongoose) {}
class SymmetricEncryptedTextPrismaFieldAdapter extends CommonInterface(Text.adapters.prisma) {}

module.exports = {
    mongoose: SymmetricEncryptedTextMongooseFieldAdapter,
    knex: SymmetricEncryptedTextKnexFieldAdapter,
    prisma: SymmetricEncryptedTextPrismaFieldAdapter,
}