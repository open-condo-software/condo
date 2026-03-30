const get = require('lodash/get')

const { addShardingKey, getModelShardingKeys } = require('./context')
const { getShardingKeyFields } = require('./registry')

function extractShardingKeysFromWhere (modelName, whereClause) {
    if (!whereClause || typeof whereClause !== 'object') return {}

    const shardingFields = getShardingKeyFields(modelName)
    if (shardingFields.length === 0) return {}

    const extracted = {}

    for (const fieldName of shardingFields) {
        const value = get(whereClause, fieldName)
        if (value !== undefined && value !== null) {
            extracted[fieldName] = value
            addShardingKey(modelName, fieldName, value)
        }
    }

    return extracted
}

function buildShardingKeyFilter (modelName) {
    const shardingFields = getShardingKeyFields(modelName)
    if (shardingFields.length === 0) return null

    const storedKeys = getModelShardingKeys(modelName)
    if (!storedKeys || Object.keys(storedKeys).length === 0) return null

    const filter = {}

    for (const fieldName of shardingFields) {
        const value = storedKeys[fieldName]
        if (value !== undefined && value !== null) {
            filter[fieldName] = value
        }
    }

    return Object.keys(filter).length > 0 ? filter : null
}

function mergeShardingKeyFilter (modelName, whereClause) {
    const shardingFilter = buildShardingKeyFilter(modelName)
    if (!shardingFilter) return whereClause

    if (!whereClause) return shardingFilter

    return {
        AND: [whereClause, shardingFilter],
    }
}

function injectShardingKeyIntoArgs (modelName, args) {
    const mergedWhere = mergeShardingKeyFilter(modelName, args.where)
    if (mergedWhere) {
        args.where = mergedWhere
    }
    return args
}

module.exports = {
    extractShardingKeysFromWhere,
    buildShardingKeyFilter,
    mergeShardingKeyFilter,
    injectShardingKeyIntoArgs,
}
