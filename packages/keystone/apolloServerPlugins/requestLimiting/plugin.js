const { GQLError, GQLErrorCode: { PAYLOAD_TOO_LARGE } } = require('@open-condo/keystone/errors')

const { validatePluginOptions } = require('./config.utils')
const {
    DEFAULT_REQUEST_LENGTH_LIMIT,
    DEFAULT_VARIABLES_SIZE_LIMIT_IN_BYTES,
    ROOT_QUERY_LENGTH_EXCEEDED_ERROR_TYPE,
    VARIABLES_SIZE_EXCEEDED_ERROR_TYPE,
} = require('./constants')
const { computeObjectSizeInBytes } = require('./size.utils')


class ApolloRequestLimitingPlugin {
    #queryLengthLimit = DEFAULT_REQUEST_LENGTH_LIMIT
    #variablesSizeLimit = DEFAULT_VARIABLES_SIZE_LIMIT_IN_BYTES

    constructor (opts = {}) {
        opts = validatePluginOptions(opts)

        if (typeof opts.queryLengthLimit === 'number') {
            this.#queryLengthLimit = opts.queryLengthLimit
        }
        if (typeof opts.variablesSizeLimit === 'number') {
            this.#variablesSizeLimit = opts.variablesSizeLimit
        }
    }

    requestDidStart () {
        return {
            didResolveSource: async (requestContext) => {
                if (requestContext.source.length > this.#queryLengthLimit) {
                    throw new GQLError({
                        code: PAYLOAD_TOO_LARGE,
                        type: ROOT_QUERY_LENGTH_EXCEEDED_ERROR_TYPE,
                        message: `GraphQL query length limit exceeded. Query size can not be more than ${this.#queryLengthLimit} characters`,
                        messageForUser: `api.global.requestLimit.${ROOT_QUERY_LENGTH_EXCEEDED_ERROR_TYPE}`,
                        messageInterpolation: {
                            queryLength: requestContext.source.length,
                        },
                    }, requestContext.context)
                }

                const variablesSizeInBytesExcludingFiles = computeObjectSizeInBytes(requestContext.request?.variables || {})

                if (variablesSizeInBytesExcludingFiles > this.#variablesSizeLimit) {
                    throw new GQLError({
                        code: PAYLOAD_TOO_LARGE,
                        type: VARIABLES_SIZE_EXCEEDED_ERROR_TYPE,
                        message: 'Variables size limit exceeded. Consider using simpler filters or decreasing batch size',
                        messageForUser: `api.global.requestLimit.${VARIABLES_SIZE_EXCEEDED_ERROR_TYPE}`,
                        messageInterpolation: {
                            variablesSize: variablesSizeInBytesExcludingFiles,
                        },
                    }, requestContext.context)
                }
            },
        }
    }
}

module.exports = {
    ApolloRequestLimitingPlugin,
}
