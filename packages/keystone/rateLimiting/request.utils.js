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

function extractSelectionSet (selectionSet) {
    return Object.assign({}, ...selectionSet.selections.map(selection => ({ [selection.name.value]: selection.selectionSet ? extractSelectionSet(selection.selectionSet) : true })))
}

function extractQueriesAndMutationsFromRequest (requestContext) {
    const ast = requestContext.document
    /**
     * @typedef Selection
     * @type {Record<string, boolean | Selection>}
     * */
    /** @typedef {{ name: string, args: Record<string, unknown>, selection: Selection }} FieldInfo */
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
                        selection: extractSelectionSet(selection.selectionSet),
                    }
                    const listToPush = definition.operation === 'query' ? queries : mutations
                    listToPush.push(value)
                }
            }
        }
    }

    return { queries, mutations }
}

module.exports = {
    extractQueriesAndMutationsFromRequest,
}