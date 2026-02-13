const { NatsClient } = require('./client')
const { NatsMiddleware } = require('./middleware')
const { initializeNatsPublisher, publish, closeNatsPublisher } = require('./publisher')
const { streamRegistry, StreamRegistry, streamNameSchema, subjectPatternSchema } = require('./streams')
const { configure, checkNatsAccess, getAvailableStreams } = require('./utils')

module.exports = {
    NatsClient,
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
}
