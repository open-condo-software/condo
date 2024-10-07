const { Keystone: DefaultKeystone } = require('@keystonejs/keystone')

const { _internalGetAsyncLocalStorage } = require('@open-condo/keystone/executionContext')

// NOTE(SavelevMatthew): separate context is required because I don't want to mix its logic executionContext one:
// 1. it has different entry points (it is hard to manage the merge process + dependency on executionContext's shape appears)
// 2. We may want to add call-stack later, merging states will become hard
const graphqlCtx = _internalGetAsyncLocalStorage('graphqlCtx')

/**
 * Wraps original apollo server resolver with context-passing logic,
 * so context can be used later in any places, such as in DB adapters
 *
 * Does not create context for nested calls, only root one initial API call is used
 *
 * https://www.apollographql.com/docs/apollo-server/data/resolvers/#resolver-arguments
 * @param originalResolver - original Keystone resolver
 * @private
 */
function _getContextResolver (originalResolver) {
    return async function resolver (parent, args, context, info) {
        const existingCtx = graphqlCtx.getStore()

        // Note: we need to track only initial call (via API / task), subsequent calls are not the point of interest for now
        if (existingCtx) {
            return await originalResolver(parent, args, context, info)
        }

        const rootContext = { context, info }

        return await graphqlCtx.run(rootContext, originalResolver, parent, args, context, info)
    }
}

const basicRegex = /^[a-z\d_+]+$/i

class Keystone extends DefaultKeystone {
    getResolvers ({ schemaName }) {
        const { Query, Mutation, ...restResolvers } = super.getResolvers({ schemaName })

        const wrappedResolvers = restResolvers

        if (Query) {
            wrappedResolvers.Query = Object.fromEntries(
                Object.entries(Query).map(([queryName, resolver]) => {
                    return [queryName, _getContextResolver(resolver)]
                })
            )
        }

        if (Mutation) {
            wrappedResolvers.Mutation = Object.fromEntries(
                Object.entries(Mutation).map(([mutationName, resolver]) => {
                    return [mutationName, _getContextResolver(resolver)]
                })
            )
        }

        return wrappedResolvers
    }
}

module.exports = {
    Keystone,
}
