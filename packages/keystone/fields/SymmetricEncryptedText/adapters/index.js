const { Text } = require('@keystonejs/fields')
const isNil = require('lodash/isNil')

const { RegexplessKnexFieldAdapter } = require('@open-condo/keystone/fields/utils/RegexplessKnexFieldAdapter')

const CommonInterface = superclass => class extends superclass {
    
    /** @type {CipherManager} */
    cipherManager
    
    constructor () {
        super(...arguments) 
        this.cipherManager = this.config.cipherConfig.cipherManager
    }

    setupHooks ({ addPreSaveHook }) {

        addPreSaveHook(item => {
            if (!isNil(item) && !isNil(item[this.path])) {
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