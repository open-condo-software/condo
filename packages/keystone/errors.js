/**
 * Generic error codes, that should be used in custom queries and mutations
 * We kept its set to minimum to not complicate things for third-party developers
 *
 * @example
 * ```js
 * const { GQLError, GQLErrorCode } = require('@open-condo/keystone/errors')
 *
 * // Declare all errors, that can be thrown by a custom action, implemented below
 * const ERRORS = {
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
 *                 // Pass declared ERRORS object here to get formatted documentation in GraphiQL
 *                 errors: ERRORS,
 *             },
 *             resolver: async (parent, args, context) => {
 *                 // validate passed arguments
 *                 if (!normalizePhone(args.phone)) {
 *                     // Use our customized error class and pass appropriate error into it
 *                     throw new GQLError(ERRORS.WRONG_PHONE_FORMAT)
 *                 }
 *
 *                 // find some record
 *                 const user = await User.getOne(context, { id: args.userId })
 *                 if (!user) {
 *                     throw new GQLError(ERRORS.UNABLE_TO_FIND_USER)
 *                 }
 *
 *                 // execute some another actions, that is not guaranteed to be succeed
 *                 try {
 *                     executeSomeAnotherAction
 *                 } catch(e) {
 *                     throw new GQLError({
 *                         ...ERRORS.UNABLE_EXECUTE_SOME_PROCEDURE,
 *                         internalError: e
 *                     })
 *                 }
 *             }
 *         }
 *     ]
 * })
 * ```
 */

const cuid = require('cuid')
const { cloneDeep, template, templateSettings, isArray, isEmpty, isObject, isError, every } = require('lodash')

const conf = require('@open-condo/config')
const { extractReqLocale } = require('@open-condo/locales/extractReqLocale')
const { getTranslations } = require('@open-condo/locales/loader')

const { getLogger } = require('./logging')
const { GQLErrorCode, GQLInternalErrorTypes, HTTPStatusByGQLErrorCode } = require('./utils/errors/constants')

// Matches placeholder `{name}` in string, we are going to interpolate
templateSettings.interpolate = /{([\s\S]+?)}/g

const { UNAUTHENTICATED } = GQLErrorCode
const logger = getLogger('gql-error-class')

/**
 * Error object, that can be thrown in a custom GraphQL mutation or query
 *
 * @typedef GQLError
 * @property {String} [mutation] - name of mutation where the error has been occured
 * @property {String} [query] - name of query where the error has been occured
 * @property {Array.<String>} [variable] - path to mutation or query argument, that is a subject of an error
 * @property {GQLErrorCode} code - standardized error code
 * @property {String} type - domain-specific error type
 * @property {String} message - message for developer
 * @property {String} [messageForUser] - i18n key for localized version of message, that intended to be displayed for user. Value of this property will be replaced with translated one
 * @property {Object.<string, string|number>} [messageInterpolation] - object with values for placeholder variables `{var}`, presented in translated versions of message
 * @property {String} [correctExample] - correct value of an argument
 * @property {Object} [data] - any kind of data, that will help to figure out a cause of the error
 */
class GQLError extends Error {
    /**
     * @param {GQLError} fields
     * @param {undefined|Object} context - Keystone custom resolver context, used to determine request language
     * @param {undefined|Array<Error>?} originalErrors - Array of parent errors or parent error
     * @see https://www.apollographql.com/docs/apollo-server/data/errors/#custom-errors
     */
    constructor (fields, context, originalErrors) {
        if (isEmpty(fields) || !fields) throw new Error('GQLError: wrong fields argument')
        if (!fields.code) throw new Error('GQLError: you need to set fields.code')
        if (!fields.type && fields.code !== UNAUTHENTICATED) throw new Error('GQLError: you need to set fields.type')
        if (!fields.message) throw new Error('GQLError: you need to set fields.message')
        if (typeof fields.variable !== 'undefined' && !isArray(fields.variable)) throw new Error('GQLError: wrong argument type! fields.variable should be a list')
        if (typeof fields.query !== 'undefined' && typeof fields.query !== 'string') throw new Error('GQLError: wrong query argument type! fields.query should be a string')
        if (typeof fields.mutation !== 'undefined' && typeof fields.mutation !== 'string') throw new Error('GQLError: wrong mutation argument type! fields.mutation should be a string')
        if (typeof fields.messageForUser !== 'undefined' && typeof fields.messageForUser !== 'string') throw new Error('GQLError: wrong messageForUser argument type! fields.messageForUser should be a string')
        if (typeof fields.messageInterpolation !== 'undefined' && (isEmpty(fields.messageInterpolation) || !isObject(fields.messageInterpolation))) throw new Error('GQLError: wrong messageInterpolation argument type! fields.messageInterpolation should be an object')
        if (typeof fields.correctExample !== 'undefined' && typeof fields.correctExample !== 'string') throw new Error('GQLError: wrong correctExample argument type! fields.correctExample should be a string')
        if (typeof fields.context !== 'undefined') throw new Error('GQLError: wrong context argument position! You should pass it as the second argument')
        if (typeof originalErrors !== 'undefined' && !isArray(originalErrors) && !isError(originalErrors)) throw new Error('GQLError: wrong parent errors argument type')
        if (isArray(originalErrors) && !every(originalErrors, isError)) throw new Error('GQLError: wrong parent errors array element type')
        const errors = (originalErrors && !isArray(originalErrors)) ? [originalErrors] : originalErrors
        if (typeof originalErrors !== 'undefined' && (!isArray(errors) || errors.length <= 0)) throw new Error('GQLError: internal error! this.errors should be undefined or not empty error')
        // We need a clone to avoid modification of original errors declaration, that will cause
        // second calling of this constructor to work with changed fields
        const extensions = cloneDeep(fields)
        try {
            extensions.message = template(fields.message)(fields.messageInterpolation)
        } catch (e) {
            const error = new Error(`GQLError: template rendering error: ${e.message}`)
            error.fields = fields
            throw error
        }
        if (fields.messageForUser) {
            if (!fields.messageForUser.startsWith('api.')) {
                logger.warn({ msg: 'WRONG `messageForUser` field argument! It should starts with `api.` prefix! messageForUser', data: { messageForUser: fields.messageForUser } })
                // TODO(pahaz): DOMA-10345 throw error for that cases! Waiting for apps refactoring
                // throw new Error('GQLError: wrong `messageForUser` field argument. Should starts with `api.`')
            }
            if (!context) {
                logger.warn({ msg: 'WRONG `messageForUser` without context argument! Important to pass GQLError({ .. }, context) argument!' })
                // TODO(pahaz): DOMA-10345 throw error for that cases! Waiting for apps refactoring
                // throw new Error('GQLError: no context for messageForUser. You can use `{ req }` as context')
            }
            const locale = extractReqLocale(context?.req) || conf.DEFAULT_LOCALE
            const translations = getTranslations(locale)
            const translatedMessage = translations[fields.messageForUser]
            extensions.messageForUser = template(translatedMessage)(fields.messageInterpolation)
            extensions.messageForUserTemplateKey = fields.messageForUser
            if (extensions.messageForUser) {
                if (!isEmpty(fields.messageInterpolation) && translatedMessage?.includes('{')) {
                    extensions.messageForUserTemplate = translatedMessage
                }
            } else {
                // TODO(pahaz): we should log it. looks like missed translation key!
                delete extensions.messageForUser
            }
            if (extensions.messageForUser === extensions.messageForUserTemplateKey) {
                // TODO(pahaz): DOMA-10345 throw error for that cases! Waiting for apps refactoring
                logger.warn({
                    msg: 'GQLError: it loos like you already hardcode localised message inside messageForUser. ' +
                        'Could you please use translation key here!',
                    data: { messageForUser: extensions.messageForUser },
                })
            }
        }
        if (!isEmpty(fields.messageInterpolation)) {
            if (fields.message === extensions.message) {
                // TODO(pahaz): DOMA-10345 throw error for that cases! Waiting for apps refactoring
                logger.warn({
                    msg: 'GQLError: looks like you already include `messageInterpolation` values inside `message`. ' +
                        'Please use templated string like `{name}` inside the message field.',
                    data: { message: fields.message },
                })
            }
            for (const [key, value] of Object.entries(fields.messageInterpolation)) {
                // TODO(pahaz): DOMA-10345 throw error
                if (typeof key !== 'string') logger.warn({ msg: 'GQLError: messageInterpolation key is not a string', data: { key } })
                if (typeof value !== 'string' && typeof value !== 'number') logger.warn({ msg: 'GQLError: messageInterpolation value is not a string|number', data: { key, value, type: typeof value } })
            }
        }
        super(extensions.message)
        this.name = extensions?.name || 'GQLError'
        this.extensions = extensions
        this.reqId = context?.req?.id
        this.uid = cuid()
        this.errors = errors
        // NOTE(pahaz): cleanup field copy
        delete extensions.context
        delete extensions.name
    }
}

module.exports = {
    GQLError,
    GQLErrorCode,
    GQLInternalErrorTypes,
    HTTPStatusByGQLErrorCode,
}
