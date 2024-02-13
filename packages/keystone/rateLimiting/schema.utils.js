function extractPossibleArgsFromSchemaQueries (schema) {
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

function extractKeystoneListsData (keystone) {
    /** @type {Record<string, string>} */
    const listQueries = {}
    /** @type {Record<string, string>} */
    const listMetaQueries = {}
    /** @type {Record<string, Array<{ fieldName: string, listKey: string }>>} */
    const listRelations = {}

    for (const list of Object.values(keystone.lists)) {
        const listName = list.key
        listQueries[list.gqlNames.listQueryName] = listName
        listMetaQueries[list.gqlNames.listQueryMetaName] = listName
        listRelations[listName] = Object.entries(list.processedCreateListConfig.fields)
            .filter(([_, field]) => field && field.ref)
            // NOTE: Split by . in case of { ref: 'B2BApp.accessRights' }
            .map(([fieldName, field]) => ({ fieldName, listKey: field.ref.split('.')[0] }))
    }

    return { listQueries, listMetaQueries, listRelations }
}

module.exports = {
    extractPossibleArgsFromSchemaQueries,
    extractKeystoneListsData,
}