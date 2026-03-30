const shardingKeyRegistry = {}

function registerShardingKeyFields (modelName, fieldNames) {
    shardingKeyRegistry[modelName] = fieldNames || []
}

function getShardingKeyFields (modelName) {
    return shardingKeyRegistry[modelName] || []
}

module.exports = {
    registerShardingKeyFields,
    getShardingKeyFields,
}
