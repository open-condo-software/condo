const { extractReqLocale } = require('@condo/domains/common/utils/locales')
const { getTranslations } = require('@condo/domains/common/utils/localesLoader')
const { Text } = require('@keystonejs/fields')
const minimatch = require('minimatch')

// docs: https://github.com/keystonejs/keystone-5/blob/a7b19759a007fd2d6dcfcf6a998c9706d5dfdaa6/packages/fields/src/Implementation.js
class LocalizedText extends Text.implementation {
    constructor () {
        super(...arguments)
        if (!this.config.template) {
            throw new Error(`Provide template id from language dictionary for localized text field: ${this.listKey}.${this.path}. Example: "employee.role.title.*'`)
        }
    }

    gqlOutputFieldResolvers () {
        return {
            [`${this.path}`]: (item, args, context, info) => {
                const locale = extractReqLocale(context.req)
                const translations = getTranslations(locale)
                // collision detection
                if (translations[item[this.path]] && minimatch(item[this.path], this.config.tempalte)) {
                    return translations[item[this.path]]
                }
                return item[this.path]
            },
        }
    }
}
module.exports = {
    LocalizedText,
}