const { Keystone: DefaultKeystone } = require('@keystonejs/keystone')

const { _patchResolverWithGQLContext } = require('../utils/resolvers')

class Keystone extends DefaultKeystone {
    getResolvers ({ schemaName }) {
        const originalResolvers = super.getResolvers({ schemaName })

        return _patchResolverWithGQLContext(originalResolvers)
    }
}

module.exports = {
    Keystone,
}
