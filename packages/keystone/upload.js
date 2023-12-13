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

module.exports = {
    wrapUploadFile,
}