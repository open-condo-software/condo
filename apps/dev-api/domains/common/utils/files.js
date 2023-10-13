const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')


// TODO: Move everything to @open-condo/keystone or somewhere outside of condo to avoid possible side-effects
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { getFileMetaAfterChange, makeFileAdapterMiddleware } = require('@condo/domains/common/utils/fileAdapter')
const { INVALID_MIMETYPE } = require('@dev-api/domains/common/constants/errors')

const ERRORS = {
    INVALID_MIMETYPE: {
        code: BAD_USER_INPUT,
        type: INVALID_MIMETYPE,
        message: 'Attached file have invalid mimetype',
        messageForUser: 'errors.INVALID_MIMETYPE.message',
    },
}

function getMimeTypesValidator ({ allowedTypes }) {
    return function validateInput ({ resolvedData, fieldPath, context }) {
        const mimeType = get(resolvedData, [fieldPath, 'mimetype'])
        if (!allowedTypes.includes(mimeType)) {
            throw new GQLError({
                ...ERRORS.INVALID_MIMETYPE,
                messageInterpolation: { types: allowedTypes },
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