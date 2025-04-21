const { GQLError, GQLErrorCode: { TOO_LARGE_REQUESTS } } = require('@open-condo/keystone/errors')

const { ERROR_TYPE } = require('./constants')


class ApolloPayloadLimitingPlugin {
    constructor (keystone, opts = 2000) {
        this.maxPayloadSize = opts
    }

    requestDidStart (requestContext) {
        return {
            didResolveSource: async (requestContext) => {
                if (requestContext.source.length > this.maxPayloadSize) {
                    throw new GQLError({
                        code: TOO_LARGE_REQUESTS,
                        type: ERROR_TYPE,
                        message: `Query payload over limit. Root level queries can not be >${this.maxPayloadSize}`,
                        messageForUser: `api.global.api.global.payloadLimit.${ERROR_TYPE}`,
                    }, requestContext.context)
                }
            },
        }
    }
}

module.exports = {
    ApolloPayloadLimitingPlugin,
}
