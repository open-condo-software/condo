const cloneDeep = require('lodash/cloneDeep')

/**
 * Generic error codes, that should be used in custom queries and mutations
 * We kept its set to minimum to not complicate things for third-party developers
 *
 * @example
 * ```js
 * const { GQLError, GQLErrorCode } = require('@core/keystone/errors')
 *
 * // Declare all errors, that can be thrown by a custom action, implemented below
 * const errors = {
 *     // A key for an error is in free form for local usage inside a module. It will not be rendered somewhere
 *     // Take Look at `CondoGraphQLSchemaError` JsDoc type declaration for detailed explanation of each field
 *     WRONG_PHONE_FORMAT: { mutation: 'myCustomSchema', variable: ['data', 'phone'], code: GQLErrorCode.BAD_USER_INPUT,  message: 'Wrong format of provided phone number', correctExample: '+79991234567' },
 *     UNABLE_TO_FIND_USER: { mutation: 'myCustomSchema', variable: ['data', 'userId'], code: GQLErrorCode.NOT_FOUND, message: 'Unable to find specified user' },
 *     UNABLE_EXECUTE_SOME_PROCEDURE: { mutation: 'myCustomSchema', code: GQLErrorCode.INTERNAL_ERROR, message: `Oops, something went wrong` },
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
 *                     throw new GQLError(errors.WRONG_PHONE_FORMAT)
 *                 }
 *
 *                 // find some record
 *                 const user = await User.getOne(context, { id: args.userId })
 *                 if (!user) {
 *                     throw new GQLError(errors.UNABLE_TO_FIND_USER)
 *                 }
 *
 *                 // execute some another actions, that is not guaranteed to be succeed
 *                 try {
 *                     executeSomeAnotherAction
 *                 } catch(e) {
 *                     throw new GQLError({
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
const { extractReqLocale } = require('@condo/domains/common/utils/locale')
const conf = require('@core/config')
const { getTranslations } = require('@condo/domains/common/utils/localesLoader')
const template = require('lodash/template')
const templateSettings = require('lodash/templateSettings')

// Matches placeholder `{name}` in string, we are going to interpolate
templateSettings.interpolate = /{([\s\S]+?)}/g

// User input cannot be processed by server by following reasons:
// wrong format, not enough data, conflicts with data storage constraints (duplicates etc)
const BAD_USER_INPUT = 'BAD_USER_INPUT'
// Generic error, that something went wrong at server side, though user input was correct
const INTERNAL_ERROR = 'INTERNAL_ERROR'
// Access denied
const FORBIDDEN = 'FORBIDDEN'


/**
 * First level of error classification, used in custom GraphQL queries or mutations
 * Second level of classification will be specific to domain in question
 * Only generic error kinds are listed
 * Conceptually, it conforms to HTTP standard for error codes
 * @readonly
 * @enum {String}
 */
const GQLErrorCode = {
    BAD_USER_INPUT,
    INTERNAL_ERROR,
    FORBIDDEN,
}


/**
 * Error object, that can be thrown in a custom GraphQL mutation or query
 *
 * @typedef GQLError
 * @property {String} [mutation] - name of mutation where the error has been occured
 * @property {String} [query] - name of query where the error has been occured
 * @property {Array.<String>} [variable] - path to mutation or query argument, that is a subject of an error
 * @property {GQLErrorCode} code - standardized error code
 * @property {String} message - message for developer
 * @property {String} [messageForUser] - i18n key for localized version of message, that intended to be displayed for user. Value of this property will be replace with translated one
 * @property {Object.<string, string|number>} messageInterpolation - object with values for placeholder variables `{var}`, presented in translated versions of message
 * @property {String} [correctExample] - correct value of an argument
 * @property {Object} [internalError] - error from internal part of the system. Not required, because in some cases it is not secure to expose internal error messages
 */

class GQLError extends ApolloError {
    /**
     * @param {GQLError} fields
     * @param context - Keystone custom resolver context, used to determine request language
     * @see https://www.apollographql.com/docs/apollo-server/data/errors/#custom-errors
     */
    constructor (fields, context) {
        // We need a clone to avoid modification of original errors declaration, that will cause
        // second calling of this constructor to work with changed fields
        const extensions = cloneDeep(fields)
        const message = template(fields.message)(fields.messageInterpolation)
        extensions.message = message
        if (context) {
            // todo use i18n from apps/condo/domains/common/utils/localesLoader.js
            const locale = extractReqLocale(context.req) || conf.DEFAULT_LOCALE
            const translations = getTranslations(locale)
            const translatedMessage = translations[fields.messageForUser]
            const interpolatedMessageForUser = template(translatedMessage)(fields.messageInterpolation)
            extensions.messageForUser = interpolatedMessageForUser
        }
        super(message, fields.code, extensions)
        Object.defineProperty(this, 'name', { value: 'GraphQLError' })
    }
}

module.exports = {
    GQLError,
    GQLErrorCode,
}