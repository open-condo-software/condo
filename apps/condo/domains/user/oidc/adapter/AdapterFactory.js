const { RedisAdapter } = require('./RedisAdapter')
const { GQLAdapter } = require('./GQLAdapter')

function createAdapterClass (context = null) {
    return class AdapterFactory {
        constructor (name) {
            //Store Client inside keystone gql and others models inside Redis!
            if (name === 'Client') {
                if (!context) {
                    throw new Error('The context is mandatory for GQLAdapter')
                }
                return new GQLAdapter(name, context)
            }
            return new RedisAdapter(name)
        }
    }
}

module.exports = {
    createAdapterClass,
}
