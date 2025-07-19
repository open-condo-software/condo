const { LOCALES } = require('@condo/domains/common/constants/locale')

/**
 * Sets specified locale to execute GraphQL queries server-side without having an HTTP-request scope
 * A use case of this kind of hack is to get values from field of type `LocalizedText` in desired locale
 * outside of scope of HTTP-request, for example, in scope of a worker
 *
 * @example
 * const { keystone: context } = await getSchemaCtx('TicketStatus')
 * setLocaleForKeystoneContext(context, EN_LOCALE)
 * const statuses = await TicketStatus.getAll(context, {}) // will get `name` of TicketStatus in English
 */
const setLocaleForKeystoneContext = (context, locale) => {
    if (!LOCALES.hasOwnProperty(locale)) {
        throw new Error(`Cannot set locale "${locale}" for Keystone context, because it is currently not supported!`)
    }
    if (!context.hasOwnProperty('req')) {
        context.req = {}
    }
    context.req.locale = locale
}

module.exports = {
    setLocaleForKeystoneContext,
}