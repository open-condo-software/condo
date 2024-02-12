function extractArgValue (valueNode, variables) {
    switch (valueNode.kind) {
        case 'Variable':
            return variables[valueNode.name.value]
        case 'ObjectValue':
            return Object.assign({}, ...valueNode.fields.map(field => ({ [field.name.value]: extractArgValue(field.value, variables) })))
        case 'ListValue':
            return valueNode.values.map(item => extractArgValue(item, variables))
        default:
            return valueNode.value
    }
}

function extractQueriesAndMutationsWithArgumentsFromRequest (requestContext) {
    const ast = requestContext.document
    /** @typedef {{ name: string, args: Record<string, unknown> }} FieldInfo */
    /** @type Array<FieldInfo> */
    const queries = []
    /** @type Array<FieldInfo> */
    const mutations = []

    for (const definition of ast.definitions) {
        if (definition.kind !== 'OperationDefinition') {
            continue
        }
        if (definition.operation === 'query' || definition.operation === 'mutation') {
            const selectionSet = definition.selectionSet.selections
            for (const selection of selectionSet) {
                if (selection.kind === 'Field') {
                    const fieldName = selection.name.value
                    /** @type {Array<{ name: string, value: unknown }>} */
                    const argList = selection.arguments
                        ? selection.arguments.map(arg => {
                            return ({
                                name: arg.name.value,
                                value: extractArgValue(arg.value, requestContext.request.variables),
                            })
                        })
                        : []
                    const value = { name: fieldName, args: Object.assign({}, ...argList.map(arg => ({ [arg.name]: arg.value }))) }
                    const listToPush = definition.operation === 'query' ? queries : mutations
                    listToPush.push(value)
                }
            }
        }
    }

    return { queries, mutations }
}

/** @implements {import('apollo-server-plugin-base').ApolloServerPlugin} */
class ApolloRateLimitingPlugin {
    /** @type {Record<string, Array<string>>} */
    #queriesArgs = {}
    #keystone = null

    constructor (keystone) {
        this.#keystone = keystone
        // for (const field of Object.values(keystone.lists)) {
        //     console.log(field)
        //     break
        // }
        // console.log(Object.keys(keystone.lists['B2CAppBuild']))
        // console.log(JSON.stringify(keystone.lists['B2CAppBuild'].processedCreateListConfig, null, 2))
    }


    #extractPossibleArgumentsFromSchemaQueries (schema) {
        /** @type {Record<string, Array<string>>} */
        const queries = {}

        const queryType = schema.getQueryType()
        if (!queryType) {
            return queries
        }
        const fields = queryType.getFields()
        for (const [fieldName, fieldDefinition] of Object.entries(fields)) {
            queries[fieldName] = fieldDefinition.args.map(arg => arg.name)
        }
        return queries
    }

    serverWillStart (service) {
        const { schema } = service
        this.#queriesArgs = this.#extractPossibleArgumentsFromSchemaQueries(schema)
    }

    requestDidStart () {
        return {
            didResolveOperation (requestContext) {
                const result = extractQueriesAndMutationsWithArgumentsFromRequest(requestContext)
                console.log(JSON.stringify(result, null, 2))
            },
        }
    }
}

module.exports = {
    ApolloRateLimitingPlugin,
}