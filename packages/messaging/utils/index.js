const { matchTopic, isTopicAllowed } = require('./topicMatch')

const { configure, checkAccess, getAvailableChannels } = require('../core/AccessControl')

module.exports = {
    configure,
    checkAccess,
    getAvailableChannels,
    matchTopic,
    isTopicAllowed,
}

