const { addShardingKey, getModelShardingKeys, clearShardingKeyContext } = require('./context')
const { registerShardingKeyFields, getShardingKeyFields } = require('./registry')
const {
    extractShardingKeysFromWhere,
    buildShardingKeyFilter,
    mergeShardingKeyFilter,
    injectShardingKeyIntoArgs,
} = require('./utils')

function declareShardingKeys (modelName, fieldNames) {
    registerShardingKeyFields(modelName, fieldNames)
}

module.exports = {
    declareShardingKeys,
    registerShardingKeyFields,
    getShardingKeyFields,
    addShardingKey,
    getModelShardingKeys,
    clearShardingKeyContext,
    extractShardingKeysFromWhere,
    buildShardingKeyFilter,
    mergeShardingKeyFilter,
    injectShardingKeyIntoArgs,
}
