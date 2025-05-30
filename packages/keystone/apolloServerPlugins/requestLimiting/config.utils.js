const Ajv = require('ajv')

const ajv = new Ajv()

const PLUGIN_OPTIONS_SCHEMA = {
    type: 'object',
    properties: {
        queryLengthLimit: { type: 'number' },
        variablesSizeLimit: { type: 'number' },
    },
    additionalProperties: false,
}

const _validate = ajv.compile(PLUGIN_OPTIONS_SCHEMA)

function validatePluginOptions (options) {
    if (!_validate(options)) {
        throw new TypeError(`Invalid ApolloRequestLimitingPlugin options provided: ${ajv.errorsText(_validate.errors)}`)
    }

    return options
}

module.exports = {
    validatePluginOptions,
}