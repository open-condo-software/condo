const { ApolloQueryBlockingPlugin } = require('./queryBlocking')
const { ApolloRateLimitingPlugin } = require('./rateLimiting')
const { ApolloRequestLimitingPlugin } = require('./requestLimiting')
const { ApolloTokenScopesPlugin } = require('./tokenScopes')

module.exports = {
    ApolloQueryBlockingPlugin,
    ApolloRateLimitingPlugin,
    ApolloRequestLimitingPlugin,
    ApolloTokenScopesPlugin,
}