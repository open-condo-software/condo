/**
 * Errors, that should be used in custom queries or mutations
 *
 * @example
 * ```js
 * const { BAD_USER_INPUT, NOT_FOUND, GraphQLError } = require('@core/keystone/errors')
 *
 * // Declare all errors, that can be thrown by a custom action, implemented below
 * const errors = {
 *     // A key for an error is in free form for local usage inside a module. It will not be rendered somewhere
 *     // Take Look at `CondoGraphQLSchemaError` JsDoc type declaration for detailed explanation of each field
 *     WRONG_PHONE_FORMAT: { argument: 'phone', code: BAD_USER_INPUT,  message: 'Wrong format of provided phone number', correctExample: '+79991234567' },
 *     UNABLE_TO_FIND_USER: { argument: 'userId', code: NOT_FOUND, message: 'Unable to find specified user' },
 *     UNABLE_EXECUTE_SOME_PROCEDURE: { code: INTERNAL_ERROR, message: `Oops, something went wrong` },
 * }
 *
 * const MyCustomSchema = new GQLCustomSchema('myCustomAction', {
 *     types: [
 *         {
 *             access: true,
 *             type: 'input MyCustomActionInput { dv: Int!, sender: SenderFieldInput!, phone: String, userId: String }',
 *         }
 *     ],
 *     mutations: [
 *         {
 *             access: true,
 *             schema: 'myCustomAction(data: MyCustomActionInput!): User',
 *             doc: {
 *                 summary: 'Does this and that, shortly',
 *                 description: 'More detailed explanation goes here',
 *                 // Pass declared errors object here to get formatted documentation in GraphiQL
 *                 errors,
 *             },
 *             resolver: async (parent, args, context) => {
 *                 // validate passed arguments
 *                 if (!normalizePhone(args.phone)) {
 *                     // Use our customized error class and pass appropriate error into it
 *                     throw new GraphQLError(errors.WRONG_PHONE_FORMAT)
 *                 }
 *
 *                 // find some record
 *                 const user = await User.getOne(context, { id: args.userId })
 *                 if (!user) {
 *                     throw new GraphQLError(errors.UNABLE_TO_FIND_USER)
 *                 }
 *
 *                 // execute some another actions, that is not guaranteed to be succeed
 *                 try {
 *                     executeSomeAnotherAction
 *                 } catch(e) {
 *                     throw new GraphQLError({
 *                         ...errors.UNABLE_EXECUTE_SOME_PROCEDURE,
 *                         internalError: e
 *                     })
 *                 }
 *             }
 *         }
 *     ]
 * })
 * ```
 */
const { ApolloError } = require('apollo-server-errors')

// Unable to find a record, whose identifier is specified in some argument of query or mutation
const NOT_FOUND = 'NOT_FOUND'
// Wrong format or not enough data in user input
const BAD_USER_INPUT = 'BAD_USER_INPUT'
// Generic error, that something went wrong at server side, though user input was correct
const INTERNAL_ERROR = 'INTERNAL_ERROR'

/**
 * Set of error types, used in custom GraphQL queries or mutations
 * @readonly
 * @enum {String}
 */
const CustomGraphQLSchemaErrorCode = {
    NOT_FOUND,
    BAD_USER_INPUT,
    INTERNAL_ERROR,
}

/**
 * Error object, that can be thrown in a custom GraphQL mutation or query
 *
 * @typedef CustomGraphQLSchemaError
 * @property {String} argument - mutation or query argument, that is a subject of an error
 * @property {CustomGraphQLSchemaErrorCode} code - standardized error code
 * @property {String} message - humanized and error description that in future will be localized
 * @property {String} [correctExample] - correct value of an argument
 * @property {Object} [internalError] - error from internal part of the system. Not required, because in some cases it is not secure to expose internal error messages
 */

class GraphQLError extends ApolloError {
    /**
     * @param {CustomGraphQLSchemaError} fields
     * @see https://www.apollographql.com/docs/apollo-server/data/errors/#custom-errors
     */
    constructor (fields) {
        super(fields.message, fields.code, fields)
        Object.defineProperty(this, 'name', { value: 'GraphQLError' })
    }
}

module.exports = {
    NOT_FOUND,
    BAD_USER_INPUT,
    INTERNAL_ERROR,
    GraphQLError,
    CondoGraphQLSchemaErrorCode: CustomGraphQLSchemaErrorCode,
}