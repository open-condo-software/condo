const { Keystone: DefaultKeystone } = require('@keystonejs/keystone')

const { _internalGetAsyncLocalStorage, _internalGetExecutionContextAsyncLocalStorage } = require('@open-condo/keystone/executionContext')

// NOTE(SavelevMatthew): separate context is required because I don't want to mix its logic executionContext one:
// 1. it has different entry points (it is hard to manage the merge process + dependency on executionContext's shape appears)
// 2. We may want to add call-stack later, merging states will become hard
const graphqlCtx = _internalGetAsyncLocalStorage('graphqlCtx')

// allModels / allModelsMeta
// { gqlOperation: "test", target: "main" }
// { gqlOperation: "createUser", target: "main" }
// { gqlOperationType: "mutation", target: "main" }

// wrap query / mutation
// if (ctx) runWithIt
// else () -> parse info
// if return function -> wrap them

// Apollo
// Parse -> N queries -> something * N -> resolver


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
        const enhanced = { ...context, queryCtx: { info } }
        const currentCtx = { context, info }

        // Note: we need to track only initial call (via API / task), subsequent calls are not the point of interest for now
        const contextToPass = existingCtx || currentCtx

        _internalGetExecutionContextAsyncLocalStorage().enterWith({ boo: '123123' })
        return await graphqlCtx.run(contextToPass, async () => {
            const result = await originalResolver(parent, args, enhanced, info)

            const a = 3

            return result
        })
    }
}

class Keystone extends DefaultKeystone {
    getResolvers ({ schemaName }) {
        const { Query, Mutation, Model, ...restResolvers } = super.getResolvers({ schemaName })

        const wrappedResolvers = restResolvers

        const original = Model.manyRelations

        const newResolver = async (item, args, context, info, boo) => {
            const c = _internalGetExecutionContextAsyncLocalStorage().getStore()
            const gql = graphqlCtx.getStore()
            const a = 3
            return await original(item, args, context, info)
        }

        // TODO: REMOVE
        wrappedResolvers.Model = {
            ...Model,
            manyRelations: newResolver,
        }

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
