const Upload = require('graphql-upload/Upload.js')

/**
 * @typedef {{
 *     stream: ReadableStream,
 *     filename?: string
 *     mimetype?: string
 *     encoding?: string
 * }} UploadFile
 * @param {UploadFile} uploadFile - file to upload. Basically object with stream / filename / mimetype / encoding
 * @return {Upload} - Upload from graphql-upload, which can be passed to server-side utils
 */
function wrapUploadFile (uploadFile) {
    if (!uploadFile.hasOwnProperty('createReadStream')) {
        uploadFile.createReadStream = () => {
            return uploadFile.stream
        }
    }
    const upload = new Upload()
    upload.resolve(uploadFile)

    return upload
}

/**
 * Provide Authorization for CustomFile HTTP attach to an external file service (e.g. condo).
 *
 * Returns a shallow copy of the Keystone context with `fileServiceAuthorization` set.
 *
 * Use for server-side updates when the app has no local FileMiddleware
 * (`FILE_UPLOAD_CONFIG`) and attaches files over HTTP.
 *
 * @example
 * const { withFileServiceAuthorization } = require('@open-condo/keystone/upload')
 * await B2BApp.update(
 *   withFileServiceAuthorization(context, `Bearer ${condoClient.authToken}`),
 *   appId,
 *   { logo: { signature, originalFilename } },
 * )
 *
 * @param {Object} context - Keystone context
 * @param {string} authorization - Full Authorization header value, e.g. `Bearer ${token}`
 * @returns {Object} new context object scoped to this call
 */
function withFileServiceAuthorization (context, authorization) {
    if (!context || typeof context !== 'object') {
        throw new Error('withFileServiceAuthorization: context is required')
    }
    if (!authorization || typeof authorization !== 'string') {
        throw new Error('withFileServiceAuthorization: authorization must be a non-empty string')
    }
    return {
        ...context,
        fileServiceAuthorization: authorization,
    }
}

module.exports = {
    wrapUploadFile,
    withFileServiceAuthorization,
}