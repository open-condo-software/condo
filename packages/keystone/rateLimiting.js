const { createRateLimitDirective, RedisStore } = require('graphql-rate-limit')

const { getRedisClient } = require('./redis')

const RATE_LIMIT_DIRECTIVE_TYPE_DEF = `
    directive @rateLimit(
        max: Int
        window: String
        message: String
        identityArgs: [String]
        arrayLengthField: String
    ) on FIELD_DEFINITION
`

const RATE_LIMIT_REDIS_CLIENT = getRedisClient()
const RATE_LIMIT_DIRECTIVE = createRateLimitDirective({
    identifyContext: (ctx) => {
        return ctx.req.ip
    },
    store: new RedisStore(RATE_LIMIT_REDIS_CLIENT),
})
const RATE_LIMIT_SCHEMA_DIRECTIVES = {
    rateLimit: RATE_LIMIT_DIRECTIVE,
}

module.exports = {
    RATE_LIMIT_DIRECTIVE_TYPE_DEF,
    RATE_LIMIT_SCHEMA_DIRECTIVES,
}