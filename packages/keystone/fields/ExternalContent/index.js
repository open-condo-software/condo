const { Text } = require('@open-keystone/fields')

const { ExternalContentImplementation } = require('./Implementation')
const { JsonKnexFieldAdapter, JsonMongooseFieldAdapter, JsonPrismaFieldAdapter } = require('../Json/Implementation')

/**
 * Public factory for creating ExternalContent-based fields.
 *
 * Example:
 *   const field = createExternalDataField({
 *       adapter: new FileAdapter('MyFolder'),
 *       format: 'json',
 *       sensitive: true,
 *       isRequired: false,
 *   })
 *
 * NOTE: This helper is part of the external API for apps / submodules.
 */
function createExternalDataField ({
    adapter,
    format = 'json',
    ...rest
} = {}) {
    return {
        type: 'ExternalContent',
        adapter,
        format,
        ...rest,
    }
}

module.exports = {
    type: 'ExternalContent',
    implementation: ExternalContentImplementation,
    adapters: {
        knex: JsonKnexFieldAdapter,
        mongoose: JsonMongooseFieldAdapter,
        prisma: JsonPrismaFieldAdapter,
    },
    views: {
        // This field is not intended to be edited via Admin UI.
        // Reuse Text views to keep UI stable if it is shown somewhere.
        Controller: require.resolve('../Json/views/Controller'),
        Field: Text.views.Field,
        Cell: Text.views.Cell,
    },
    createExternalDataField,
}

