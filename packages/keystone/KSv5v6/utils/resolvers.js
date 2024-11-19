const get = require('lodash/get')

const { graphqlCtx } = require('./graphqlCtx')

/**
 * Extracts alias map for a operation
 * @example
 * // query MyQuery{
 * //     models: allModels {
 * //         id
 * //     }
 * //     version: apiVersion
 * // }
 *
 * const aliases = _extractOperationFieldsAliases(operation)
 * // { models: 'allModels', version: 'apiVersion' }
 * @param operation
 * @returns {Record<string, string>}
 * @private
 */
function _extractOperationFieldsAliases (operation) {
    const selections = get(operation, ['selectionSet', 'selections'], [])

    return Object.fromEntries(selections.map(selection => {
        const name = selection.name.value
        const alias = get(selection, ['alias', 'value'], name)
        return [alias, name]
    }))
}

/**
 *
 * @param info
 * @returns {{gqlOperationName: string, gqlOperationType: *}}
 * @private
 */
function _extractCurrentQueryContext (info) {
    const gqlOperationType = info.operation.operation

    // Resolve root name
    let path = info.path

    while (path && path.prev) {
        path = path.prev
    }

    const aliasedOperationName = path.key
    const aliases = _extractOperationFieldsAliases(info.operation)
    const gqlOperationName = aliases[aliasedOperationName]

    return { gqlOperationName, gqlOperationType }
}

/**
 * Wraps original apollo-server resolver with context-providing logic,
 * so context can be used later inside any places, such as DB adapters
 *
 * https://www.apollographql.com/docs/apollo-server/data/resolvers/#resolver-arguments
 *
 * Things to know:
 * 1. Each sub-request will have separate info, so we keep track only for CURRENT executable operation
 * 2. Resolver can return async function, this behaviour is called "lazy resolvers",
 * so we need to traverse and wrap this with current context value
 * 3. Context is containing "gqlOperationType" and "gqlOperationName" representing current request
 * 4. Relations fields are resolved separately, so you cannot just wrap Query and Mutation resolvers but all of them,
 * 5. Operation name is defined by parsing "info.operation" to get all fields (queries) in request to map aliases
 * and "info.path" to get current aliased name
 *
 * @example
 * // myCustomMutation
 * async function resolver(parent, args, contextValue, info) {
 *     const ctx = graphqlCtx.getStore() // { gqlOperationType: 'mutation', gqlOperationName: 'myCustomMutation' }
 *
 *     // { gqlOperationType: 'mutation', gqlOperationName: 'createUser' } inside, because of sub-request
 *     await User.create()
 *
 *     // { gqlOperationType: 'query', gqlOperationName: 'allUsers' } inside, because of sub-request
 *     await User.getAll()
 *
 *     // { gqlOperationType: 'mutation', gqlOperationName: 'myCustomMutation' } inside, since NO sub-request, direct adapter usage
 *     await find('User', {})
 * }
 *
 *
 * @param originalResolver - original Keystone resolver
 * @private
 */
function _wrapResolverWithContextProvider (originalResolver) {
    return async function wrappedResolver (parent, args, contextValue, info) {
        const currentCtx = _extractCurrentQueryContext(info)

        return graphqlCtx.run(currentCtx, originalResolver, parent, args, contextValue, info)
    }
}

const allowedObjectTypes = new Set(['Object', 'GraphQLScalarType'])
const allowedValueTypes = new Set(['object', 'function'])


/**
 * Recursively traverses Resolvers, wraps each of them with context provider skipping Scalar types
 * @typedef ResolversObject
 * @type {Record<string, function | ResolversObject>}
 *
 * @param {ResolversObject} resolversObject
 * @returns {ResolversObject}
 * @private
 */
function _patchResolverWithGQLContext (resolversObject) {
    return Object.fromEntries(
        Object.entries(resolversObject).map(([key, value]) => {
            const valueType = typeof value

            if (!allowedValueTypes.has(valueType)) {
                throw new Error(`Unexpected value type inside resolvers: ${valueType}`)
            }

            // If nested object -> recursively patch all nested fields
            if (valueType === 'object') {
                const valueClassName = value.constructor.name
                if (!valueClassName || !allowedObjectTypes.has(valueClassName)) {
                    throw new Error(`Unexpected object type inside resolvers: ${valueClassName}`)
                }
                if (valueClassName === 'Object') {
                    return [key, _patchResolverWithGQLContext(value)]
                }

                return [key, value]
            }

            // Otherwise patch resolver
            return [key, _wrapResolverWithContextProvider(value)]
        })
    )
}

module.exports = {
    _patchResolverWithGQLContext,
}