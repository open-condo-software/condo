const Ajv = require('ajv')

const ajv = new Ajv()

const PLUGIN_OPTIONS_SCHEMA = {
    type: 'object',
    properties: {
        queries: {
            items: { type: 'string' },
            type: 'array',
        },
        mutations: {
            items: { type: 'string' },
            type: 'array',
        },
    },
    additionalProperties: false,
}

const _validate = ajv.compile(PLUGIN_OPTIONS_SCHEMA)

function validatePluginConfig (options) {
    if (!_validate(options)) {
        throw new TypeError(`Invalid ApolloQueryBlockingPlugin options provided: ${ajv.errorsText(_validate.errors)}`)
    }

    return options
}

module.exports = {
    validatePluginConfig,
}