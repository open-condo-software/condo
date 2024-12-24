const Ajv = require('ajv')

const ajv = new Ajv()

const PLUGIN_OPTIONS_SCHEMA = {
    type: 'object',
    properties: {
        customQuotas: { type: 'object', additionalProperties: { type: 'number' } },
        queryWeight: { type: 'number' },
        mutationWeight: { type: 'number' },
        window: { type: 'string' },
        authedQuota: { type: 'number' },
        nonAuthedQuota: { type: 'number' },
        whereScalingFactor: { type: 'number' },
        pageLimit: { type: 'number' },
    },
    additionalProperties: false,
}

const _validate = ajv.compile(PLUGIN_OPTIONS_SCHEMA)

function validatePluginOptions (options) {
    if (!_validate(options)) {
        throw new TypeError(`Invalid ApolloRateLimitingPlugin options provided: ${ajv.errorsText(_validate.errors)}`)
    }

    return options
}

module.exports = {
    validatePluginOptions,
}