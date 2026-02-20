const { NatsAdapter } = require('./adapters/nats')
const { BaseAdapter } = require('./core/BaseAdapter')
const {
    channelRegistry,
    ChannelRegistry,
    channelNameSchema,
    topicPatternSchema,
    buildTopic,
    buildRelaySubscribeTopic,
    buildRelayUnsubscribeTopic,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
} = require('./core/ChannelRegistry')
const { initializePublisher, publish, closePublisher } = require('./core/Publisher')
const { MessagingMiddleware } = require('./middleware')
const {
    configure,
    checkAccess,
    getAvailableChannels,
    matchTopic,
    isTopicAllowed,
} = require('./utils')

/**
 * Create a messaging adapter by name.
 * @param {string} [adapterName] - Adapter type. Defaults to MESSAGING_ADAPTER env var or 'nats'.
 * @returns {BaseAdapter}
 */
function createAdapter (adapterName) {
    const name = adapterName || process.env.MESSAGING_ADAPTER || 'nats'
    switch (name) {
        case 'nats':
            return new NatsAdapter()
        default:
            throw new Error(`Unknown messaging adapter: ${name}`)
    }
}

module.exports = {
    // Adapter factory
    createAdapter,
    BaseAdapter,
    NatsAdapter,

    // Channel registry
    channelRegistry,
    ChannelRegistry,
    channelNameSchema,
    topicPatternSchema,

    // Topic utilities
    buildTopic,
    buildRelaySubscribeTopic,
    buildRelayUnsubscribeTopic,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,

    // Publisher
    initializePublisher,
    publish,
    closePublisher,

    // Middleware
    MessagingMiddleware,

    // Access control
    configure,
    checkAccess,
    getAvailableChannels,

    // Topic matching
    matchTopic,
    isTopicAllowed,
}
