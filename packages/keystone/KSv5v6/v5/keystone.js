const { Keystone: DefaultKeystone } = require('@keystonejs/keystone')
const { formatError } = require('@keystonejs/keystone/lib/Keystone/format-error')
const { ApolloServer } = require('apollo-server-express')
const { has } = require('lodash')
const get = require('lodash/get')

const { _patchResolverWithGQLContext } = require('../utils/resolvers')

class Keystone extends DefaultKeystone {
    getResolvers ({ schemaName }) {
        const originalResolvers = super.getResolvers({ schemaName })

        return _patchResolverWithGQLContext(originalResolvers)
    }

    parseExtraParamsFromSession (req) {
        const extra = {}
        if (has(req.session, 'extra.allowedOrganizations')) {
            extra.allowedOrganizations = get(req.session, 'extra.allowedOrganizations')
        }
        return extra
    }

    // Copy of DefaultKeystone.createApolloServer with additional properties in context -> authentication
    createApolloServer ({ apolloConfig = {}, schemaName, dev }) {
        // add the Admin GraphQL API
        // NOTE(YEgorLu) to work this ApolloServer package should have same version as in @keystonejs/keystone
        const server = new ApolloServer({
            typeDefs: this.getTypeDefs({ schemaName }),
            resolvers: this.getResolvers({ schemaName }),
            context: ({ req }) => ({
                ...this.createContext({
                    schemaName,
                    authentication: { item: req.user, extra: this.parseExtraParamsFromSession(req), listKey: req.authedListKey },
                    skipAccessControl: false,
                }),
                ...this._sessionManager.getContext(req),
                req,
            }),
            ...(process.env.ENGINE_API_KEY || process.env.APOLLO_KEY
                ? {
                    tracing: true,
                }
                : {
                    engine: false,
                    // Only enable tracing in dev mode so we can get local debug info, but
                    // don't bother returning that info on prod when the `engine` is
                    // disabled.
                    tracing: dev,
                }),
            formatError,
            ...apolloConfig,
            uploads: false, // User cannot override this as it would clash with the upload middleware
        })
        this._schemas[schemaName] = server.schema

        return server
    }
}

module.exports = {
    Keystone,
}
