const minimatch = require('minimatch')
const { Text } = require('@keystonejs/fields')
const conf = require('@core/config')
const { getTranslations } = require('@condo/domains/common/utils/localesLoader')
const { extractReqLocale } = require('@condo/domains/common/utils/locale')

// docs: https://github.com/keystonejs/keystone-5/blob/a7b19759a007fd2d6dcfcf6a998c9706d5dfdaa6/packages/fields/src/Implementation.js
class LocalizedText extends Text.implementation {
    constructor () {
        super(...arguments)
        if (!this.config.template) {
            throw new Error(`Provide template id from language dictionary for localized text field: ${this.listKey}.${this.path}. Example: "employee.role.title.*'`)
        }
    }

    gqlOutputFields () {
        return [`${this.path}: String`, `${this.path}NonLocalized: String`]
    }

    gqlOutputFieldResolvers () {
        return {
            [this.path]: (item, args, context, info) => {
                const locale = extractReqLocale(context.req) || conf.DEFAULT_LOCALE
                const translations = getTranslations(locale)
                const fieldValue = item[this.path]
                // collision detection
                if (translations[fieldValue] && minimatch(fieldValue, this.config.template)) {
                    return translations[fieldValue]
                }
                return fieldValue
            },
            [`${this.path}NonLocalized`]: (item, args, context, info) => {
                return item[this.path]
            },
        }
    }
}

module.exports = {
    LocalizedText,
}
