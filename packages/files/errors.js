const {
    GQLErrorCode: {
        BAD_USER_INPUT,
        INTERNAL_ERROR,
        FORBIDDEN,
        TOO_MANY_REQUESTS,
        UNAUTHENTICATED,
    },
} = require('@open-condo/keystone/errors')

const AUTHORIZATION_REQUIRED = 'AUTHORIZATION_REQUIRED'
const RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
const INVALID_APP_ID = 'INVALID_APP_ID'
const UNABLE_TO_PARSE_FILE_CONTENT = 'UNABLE_TO_PARSE_FILE_CONTENT'
const MAX_FILE_UPLOAD_LIMIT_EXCEEDED = 'MAX_FILE_UPLOAD_LIMIT_EXCEEDED'
const MISSING_ATTACHED_FILES = 'MISSING_ATTACHED_FILES'
const MISSING_META = 'MISSING_META'
const REQUEST_DISCONNECTED = 'REQUEST_DISCONNECTED'
const PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE'
const INVALID_META = 'INVALID_META'
const INVALID_PAYLOAD = 'INVALID_PAYLOAD'
const WRONG_REQUEST_METHOD_TYPE = 'WRONG_REQUEST_METHOD_TYPE'
const FILE_NOT_FOUND = 'FILE_NOT_FOUND'

const ERRORS = {
    AUTHORIZATION_REQUIRED: {
        code: UNAUTHENTICATED,
        type: AUTHORIZATION_REQUIRED,
        message: 'Authorization is required',
    },
    RATE_LIMIT_EXCEEDED: {
        code: TOO_MANY_REQUESTS,
        type: RATE_LIMIT_EXCEEDED,
        message: 'You have reached the limit on the number of requests',
    },
    INVALID_APP_ID: {
        code: FORBIDDEN,
        type: INVALID_APP_ID,
        message: 'Provided appId does not have permission to upload file',
    },
    UNABLE_TO_PARSE_FILE_CONTENT: {
        code: INTERNAL_ERROR,
        type: UNABLE_TO_PARSE_FILE_CONTENT,
        message: 'Unable to parse file content',
    },
    MAX_FILE_UPLOAD_LIMIT_EXCEEDED: {
        code: BAD_USER_INPUT,
        type: MAX_FILE_UPLOAD_LIMIT_EXCEEDED,
        message: 'You have reached max concurrent file upload limit',
    },
    MISSING_ATTACHED_FILES: {
        code: BAD_USER_INPUT,
        type: MISSING_ATTACHED_FILES,
        message: 'Missing binary data in request',
    },
    MISSING_META: {
        code: BAD_USER_INPUT,
        type: MISSING_META,
        message: 'Missing multipart field "meta"',
    },
    REQUEST_DISCONNECTED: {
        code: INTERNAL_ERROR,
        type: REQUEST_DISCONNECTED,
        message: 'Request disconnected during file upload stream parsing',
    },
    PAYLOAD_TOO_LARGE: {
        code: BAD_USER_INPUT,
        type: PAYLOAD_TOO_LARGE,
        message: 'Field exceeds max upload size limit',
    },
    INVALID_META: {
        code: BAD_USER_INPUT,
        type: INVALID_META,
        message: 'Invalid file meta JSON object received',
    },
    WRONG_REQUEST_METHOD_TYPE: {
        code: BAD_USER_INPUT,
        type: WRONG_REQUEST_METHOD_TYPE,
        message: 'Wrong request method type. Only "multipart/form-data" is allowed',
    },
    FILE_NOT_FOUND: {
        code: BAD_USER_INPUT,
        type: FILE_NOT_FOUND,
        message: 'File not found or you don\'t have access to it',
    },
    INVALID_PAYLOAD: {
        code: BAD_USER_INPUT,
        type: INVALID_PAYLOAD,
        message: 'Invalid file share payload json received',
    },
}

module.exports = { ERRORS }
