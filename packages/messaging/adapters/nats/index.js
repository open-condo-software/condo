const { NatsAdapter } = require('./NatsAdapter')
const { NatsAuthCalloutService } = require('./NatsAuthCalloutService')
const { NatsClient } = require('./NatsClient')
const {
    encodeNatsJwt,
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
    registerAlgorithm,
    base64url,
    base64urlDecode,
    JWT_ALGORITHMS,
} = require('./natsJwt')
const { NatsSubscriptionRelay } = require('./NatsSubscriptionRelay')

module.exports = {
    NatsAdapter,
    NatsAuthCalloutService,
    NatsClient,
    NatsSubscriptionRelay,
    encodeNatsJwt,
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
    registerAlgorithm,
    base64url,
    base64urlDecode,
    JWT_ALGORITHMS,
}
