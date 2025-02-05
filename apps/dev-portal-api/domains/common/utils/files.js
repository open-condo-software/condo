const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getFileMetaAfterChange, makeFileAdapterMiddleware } = require('@open-condo/keystone/fileAdapter/fileAdapter')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

const { INVALID_MIMETYPE } = require('@dev-portal-api/domains/common/constants/errors')

const ERRORS = {
    INVALID_MIMETYPE: {
        code: BAD_USER_INPUT,
        type: INVALID_MIMETYPE,
        message: 'Attached file have invalid mimetype',
        messageForUser: 'api.common.INVALID_MIMETYPE',
    },
}

function getMimeTypesValidator ({ allowedTypes }) {
    return function validateInput ({ resolvedData, fieldPath, context }) {
        const mimeType = get(resolvedData, [fieldPath, 'mimetype'])
        if (!allowedTypes.includes(mimeType)) {
            throw new GQLError({
                ...ERRORS.INVALID_MIMETYPE,
                messageInterpolation: { types: allowedTypes.join(', ') },
            }, context)
        }
    }
}

module.exports = {
    FileAdapter,
    getFileMetaAfterChange,
    makeFileAdapterMiddleware,
    getMimeTypesValidator,
}
