const { OidcModelClientAdapter } = require('./OidcModelClientAdapter')
const { RedisAdapter } = require('./RedisAdapter')

function createAdapterClass (context = null) {
    return class AdapterFactory {
        constructor (name) {
            // Store Client inside keystone gql and others models inside Redis!
            if (name === 'Client') {
                if (!context) {
                    throw new Error('The context is mandatory for OidcModelClientAdapter')
                }
                return new OidcModelClientAdapter(name, context)
            }
            return new RedisAdapter(name)
        }
    }
}

module.exports = {
    createAdapterClass,
}
