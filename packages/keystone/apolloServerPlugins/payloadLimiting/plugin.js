const { GQLError, GQLErrorCode: { TOO_LARGE_REQUESTS } } = require('@open-condo/keystone/errors')

const { ERROR_TYPE, DEFAULT_PAYLOAD_LIMIT } = require('./constants')


class ApolloPayloadLimitingPlugin {

    #payloadSizeLimit = DEFAULT_PAYLOAD_LIMIT

    constructor (payloadSizeLimit) {
        if (payloadSizeLimit) {
            this.#payloadSizeLimit = payloadSizeLimit
        }
    }

    requestDidStart () {
        return {
            didResolveSource: async (requestContext) => {
                if (requestContext.source.length > this.#payloadSizeLimit) {
                    throw new GQLError({
                        code: TOO_LARGE_REQUESTS,
                        type: ERROR_TYPE,
                        message: `Query payload over limit. Root level queries can not be >${this.#payloadSizeLimit}`,
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
