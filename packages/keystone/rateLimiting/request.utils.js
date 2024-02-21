const { PLUGIN_KEY_PREFIX } = require('./constants')

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

/**
 * @param selectionSet
 * @returns {Selection}
 */
function extractSelectionSet (selectionSet) {
    return (selectionSet?.selections || []).map(selection => {
        const field = {
            name: selection.name.value,
        }
        if (selection.selectionSet) {
            field.selectionSet = extractSelectionSet(selection.selectionSet)
        }

        return field
    })
}

function extractQueriesAndMutationsFromRequest (requestContext) {
    const ast = requestContext.document
    /**
     * @typedef Selection
     * @type {Array<{ name: string, selectionSet?: Selection }>}
     * */
    /** @typedef {{ name: string, args: Record<string, unknown>, selectionSet: Selection }} FieldInfo */
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
                    const value = {
                        name: fieldName,
                        args: Object.assign({}, ...argList.map(arg => ({ [arg.name]: arg.value }))),
                        selectionSet: extractSelectionSet(selection.selectionSet),
                    }
                    const listToPush = definition.operation === 'query' ? queries : mutations
                    listToPush.push(value)
                }
            }
        }
    }

    return { queries, mutations }
}

function extractQuotaKeyFromRequest (requestContext) {
    const isAuthed = Boolean(requestContext.context.authedItem)
    const identity = isAuthed ? requestContext.context.authedItem.id : requestContext.context.req.ip
    const identityPrefix = isAuthed ? 'user' : 'ip'
    const key = [PLUGIN_KEY_PREFIX, identityPrefix, identity].join(':')

    return { isAuthed, key }
}

module.exports = {
    extractQueriesAndMutationsFromRequest,
    extractQuotaKeyFromRequest,
}