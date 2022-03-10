const get = require('lodash/get')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { extractReqLocale } = require('@condo/domains/common/utils/locale')
const conf = require('@core/config')
const { getTranslations } = require('@condo/domains/common/utils/localesLoader')
const { UNIT_TYPES } = require('@condo/domains/property/constants/common')
const access = require('@condo/domains/property/access/PropertyUnitTypeService')

const PropertyUnitTypeService = new GQLCustomSchema('PropertyUnitTypeService', {
    types: [
        {
            access: true,
            type: 'type PropertyUnitTypeInfo { type: BuildingUnitType! label: String! prefix: String! showNumber: Boolean! }',
        },
        {
            access: true,
            type: 'type PropertyUnitTypesOutput { unitTypes: [PropertyUnitTypeInfo]! }',
        },
    ],
    queries: [
        {
            access: access.canReadPropertyUnitTypes,
            schema: 'propertyUnitTypes: PropertyUnitTypesOutput',
            resolver: (parent, args, context = {}) => {
                const locale = extractReqLocale(context.req) || conf.DEFAULT_LOCALE
                const translations = getTranslations(locale)

                const unitTypes = Object.values(UNIT_TYPES).map(type => {
                    return {
                        type,
                        label: get(translations, `pages.condo.ticket.field.unitType.${type}`),
                        prefix: get(translations, `pages.condo.ticket.field.unitType.prefix.${type}`),
                        showNumber: true,
                    }
                })

                return {
                    unitTypes,
                }
            },
        },
    ],
})

module.exports = {
    PropertyUnitTypeService,
}
