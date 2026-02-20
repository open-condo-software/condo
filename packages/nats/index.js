const { AuthCalloutService } = require('./authCalloutService')
const { NatsClient } = require('./client')
const { NatsMiddleware } = require('./middleware')
const { initializeNatsPublisher, publish, closeNatsPublisher } = require('./publisher')
const {
    streamRegistry,
    StreamRegistry,
    streamNameSchema,
    subjectPatternSchema,
    buildSubject,
    buildRelaySubscribeSubject,
    buildRelayUnsubscribeSubject,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
} = require('./streams')
const { SubscriptionRelayService } = require('./subscriptionRelayService')
const {
    configure,
    checkNatsAccess,
    getAvailableStreams,
    computePermissions,
} = require('./utils')

module.exports = {
    AuthCalloutService,
    NatsClient,
    SubscriptionRelayService,
    initializeNatsPublisher,
    publish,
    closeNatsPublisher,
    streamRegistry,
    StreamRegistry,
    streamNameSchema,
    subjectPatternSchema,
    buildSubject,
    buildRelaySubscribeSubject,
    buildRelayUnsubscribeSubject,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
    NatsMiddleware,
    configure,
    checkNatsAccess,
    getAvailableStreams,
    computePermissions,
}
