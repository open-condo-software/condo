const Ajv = require('ajv')

const {
    DEFAULT_AUTHED_QUOTA,
    DEFAULT_NON_AUTHED_QUOTA,
    DEFAULT_QUOTA_WINDOW,
} = require('./constants')

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

function applyRateLimitDefaults (options = {}) {
    return {
        authedQuota: options.authedQuota || DEFAULT_AUTHED_QUOTA,
        nonAuthedQuota: options.nonAuthedQuota || DEFAULT_NON_AUTHED_QUOTA,
        window: options.window || DEFAULT_QUOTA_WINDOW,
        customQuotas: options.customQuotas || {},
    }
}

module.exports = {
    validatePluginOptions,
    applyRateLimitDefaults,
}