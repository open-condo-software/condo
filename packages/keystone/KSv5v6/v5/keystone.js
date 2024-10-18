const { Keystone: DefaultKeystone } = require('@keystonejs/keystone')

const { _patchResolvers } = require('../utils/resolvers')

class Keystone extends DefaultKeystone {
    getResolvers ({ schemaName }) {
        const originalResolvers = super.getResolvers({ schemaName })

        return _patchResolvers(originalResolvers)
    }
}

module.exports = {
    Keystone,
}
