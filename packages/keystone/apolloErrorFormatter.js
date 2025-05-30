/*
    What you need to know to understand what is going on here?

    Keystone.js is not so good to work with GraphQL errors.
    It use apollo-errors npm package for all their error.
    But the apollo-errors is not compatible with the common GraphQL spec.
    We need a way to fix it!

    1) you should read at least an example from GraphQL specification: http://spec.graphql.org/draft/#sec-Errors and https://github.com/graphql/graphql-js/blob/main/src/error/GraphQLError.ts
    2) you need to read the code from apollo-errors npm package: https://github.com/thebigredgeek/apollo-errors/blob/master/src/index.ts
    3) you need to look at: https://www.apollographql.com/docs/apollo-server/data/errors/ and https://github.com/apollographql/apollo-server/blob/apollo-server%402.23.0/packages/apollo-server-errors/src/index.ts
    4) you need to look at KeystoneJs source: https://github.com/keystonejs/keystone-5/blob/e12273f6e1ce1eaa1e7013f1feb1d158518c80c9/packages/keystone/lib/Keystone/format-error.js,
        https://github.com/keystonejs/keystone-5/blob/e12273f6e1ce1eaa1e7013f1feb1d158518c80c9/packages/keystone/lib/ListTypes/graphqlErrors.js, usage of `throwAccessDenied`, `ValidationFailureError` and `AccessDeniedError`.
        You should also check another KeystoneJs errors: LimitsExceededError and ParameterError

    We need to convert a KeystoneJS errors to friendly GraphQL format by using Apollo `formatError` function.

    Most important runtime client side errors:
     - UserInputError -- invalid value for a field argument (400)
     - AuthenticationError -- failed to authenticate (401)
     - ForbiddenError -- unauthorized to access (403)

    `formatError` call cases:
      1) inside logging plugin to log errors
      2) inside apollo-server before { errors } rendering!

    To understand where the `safeFormatError` function called by ApolloServer look at this trace (1):

          at ../../node_modules/apollo-server-core/node_modules/apollo-server-errors/src/index.ts:287:28
              at Array.map (<anonymous>)
          at Object.formatApolloErrors (../../node_modules/apollo-server-core/node_modules/apollo-server-errors/src/index.ts:285:25)

     To understand where the `safeFormatError` is also called (2):

          at Object.safeFormatError [as didEncounterErrors] (../../packages/keystone/logging/GraphQLLoggerApp.js:94:70)
          at ../../node_modules/apollo-server-core/src/utils/dispatcher.ts:20:23
              at Array.map (<anonymous>)
          at Dispatcher.callTargets (../../node_modules/apollo-server-core/src/utils/dispatcher.ts:17:20)
          at Dispatcher.<anonymous> (../../node_modules/apollo-server-core/src/utils/dispatcher.ts:30:12)

 */

const { safeFormatError, safeApolloErrorFormatter, formatError } = require('./utils/errors/safeFormatError')
const { throwAuthenticationError } = require('./utils/errors/throwAuthenticationError')

module.exports = {
    safeFormatError,
    safeApolloErrorFormatter,
    formatError,
    throwAuthenticationError,
}
