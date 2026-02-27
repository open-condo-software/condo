const { NatsAdapter } = require('./adapters/nats')
const { BaseAdapter } = require('./core/BaseAdapter')
const { CHANNELS, initializeChannels } = require('./core/ChannelRegistry')
const { initializePublisher, publish, closePublisher } = require('./core/Publisher')
const {
    CHANNEL_USER,
    CHANNEL_ORGANIZATION,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
    APP_PREFIX,
    getAppPrefix,
    buildUserTopic,
    buildOrganizationTopic,
    buildTopic,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
} = require('./core/topic')
const { MessagingMiddleware } = require('./middleware')
const { messaged } = require('./plugins')
const {
    initMessaging,
    closeMessaging,
    revokeMessagingUser,
    unrevokeMessagingUser,
    setupMessaging,
} = require('./setup')
const {
    configure,
    checkAccess,
    getAvailableChannels,
} = require('./utils')

module.exports = {
    // Adapters
    BaseAdapter,
    NatsAdapter,

    // Channels
    CHANNELS,
    CHANNEL_USER,
    CHANNEL_ORGANIZATION,
    initializeChannels,

    // Topic utilities
    APP_PREFIX,
    getAppPrefix,
    buildUserTopic,
    buildOrganizationTopic,
    buildTopic,
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

    // Setup
    initMessaging,
    closeMessaging,
    revokeMessagingUser,
    unrevokeMessagingUser,
    setupMessaging,

    // Access control
    configure,
    checkAccess,
    getAvailableChannels,
}
