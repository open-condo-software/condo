const { NatsAdapter } = require('./adapters/nats')
const { BaseAdapter } = require('./core/BaseAdapter')
const { CHANNELS, initializeChannels } = require('./core/ChannelRegistry')
const { initializePublisher, publish, closePublisher } = require('./core/Publisher')
const {
    CHANNEL_USER,
    CHANNEL_ORGANIZATION,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
    buildUserTopic,
    buildOrganizationTopic,
    buildTopic,
    buildUserRelaySubscribeTopic,
    buildOrganizationRelaySubscribeTopic,
    buildRelayUnsubscribeTopic,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
} = require('./core/topic')
const { MessagingMiddleware } = require('./middleware')
const { messaged } = require('./plugins')
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

    // Channels
    CHANNELS,
    CHANNEL_USER,
    CHANNEL_ORGANIZATION,
    initializeChannels,

    // Topic utilities
    buildUserTopic,
    buildOrganizationTopic,
    buildTopic,
    buildUserRelaySubscribeTopic,
    buildOrganizationRelaySubscribeTopic,
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

    // Plugin
    messaged,

    // Access control
    configure,
    checkAccess,
    getAvailableChannels,

    // Topic matching
    matchTopic,
    isTopicAllowed,
}
