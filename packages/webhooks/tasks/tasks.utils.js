const { gql } = require('graphql-tag')
const pluralize = require('pluralize')

const { fetch } = require('@open-condo/keystone/fetch')

// Fetch the cursor timestamp without exposing it in the webhook payload.
const WEBHOOK_SYNC_UPDATED_AT_FIELD = '_webhookSyncUpdatedAt'

const buildQuery = (modelName, fields) => {
    const pluralName = pluralize.plural(modelName)
    const closingBracketIndex = fields.lastIndexOf('}')
    const fieldsWithSyncUpdatedAt = [
        fields.slice(0, closingBracketIndex),
        `${WEBHOOK_SYNC_UPDATED_AT_FIELD}: updatedAt`,
        fields.slice(closingBracketIndex),
    ].join(' ')

    return gql`
        query ${modelName}WebhookQuery($first: Int!, $where: ${modelName}WhereInput!) {
            objs: all${pluralName}(first: $first, where: $where, sortBy: [updatedAt_ASC, id_ASC]) ${fieldsWithSyncUpdatedAt}
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
    WEBHOOK_SYNC_UPDATED_AT_FIELD,
    buildQuery,
    trySendData,
}