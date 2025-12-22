const { gql } = require('graphql-tag')
const pluralize = require('pluralize')

const { fetch } = require('@open-condo/keystone/fetch')

const buildQuery = (modelName, fields) => {
    const pluralName = pluralize.plural(modelName)

    return gql`
        query ${modelName}WebhookQuery($first: Int!, $skip: Int!, $where: ${modelName}WhereInput!) {
            objs: all${pluralName}(first: $first, skip: $skip, where: $where, sortBy: [updatedAt_ASC, id_ASC]) ${fields}
        }
    `
}

async function trySendData (url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            abortRequestTimeout: 30 * 1000,
        })

        return { ok: !!response.ok, status: response.status }
    } catch {
        // Unreachable resource
        return { ok: false, status: 523 }
    }
}

module.exports = {
    buildQuery,
    trySendData,
}