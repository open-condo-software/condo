const { RedisAdapter } = require('./RedisAdapter')

class AdapterFactory {
    constructor (name) {
        // TODO(pahaz): store Client inside keystone gql and others models inside Redis!
        return new RedisAdapter(name)
    }
}

module.exports = {
    AdapterFactory,
}
