const { AuthCalloutService } = require('./authCalloutService')
const { NatsClient } = require('./client')
const { NatsMiddleware } = require('./middleware')
const { initializeNatsPublisher, publish, closeNatsPublisher } = require('./publisher')
const { streamRegistry, StreamRegistry, streamNameSchema, subjectPatternSchema } = require('./streams')
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
    NatsMiddleware,
    configure,
    checkNatsAccess,
    getAvailableStreams,
    computePermissions,
}
