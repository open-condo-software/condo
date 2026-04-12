const shardingKeyContext = {}

function addShardingKey (modelName, fieldName, value) {
    if (!shardingKeyContext[modelName]) {
        shardingKeyContext[modelName] = {}
    }
    shardingKeyContext[modelName][fieldName] = value
}

function getModelShardingKeys (modelName) {
    return shardingKeyContext[modelName] || {}
}

function clearShardingKeyContext () {
    for (const key in shardingKeyContext) {
        delete shardingKeyContext[key]
    }
}

module.exports = {
    addShardingKey,
    getModelShardingKeys,
    clearShardingKeyContext,
}
