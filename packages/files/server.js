const FormData = require('form-data')
const jwt = require('jsonwebtoken')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { parseAndValidateFileMetaSignature, validateFileUploadSignature } = require('./utils')


function getClientSecret (fileClientId) {
    const raw = conf['FILE_UPLOAD_CONFIG']
    if (!raw) throw new Error('FILE_UPLOAD_CONFIG is not set')
    const cfg = typeof raw === 'string' ? JSON.parse(raw) : raw
    const secret = cfg?.clients?.[fileClientId]?.secret
    if (!secret) throw new Error(`Unknown fileClientId "${fileClientId}"`)
    return secret
}

function getServerUrl () {
    const serverUrl = conf['FILE_SERVER_URL'] || conf['SERVER_URL']
    if (!serverUrl) {
        throw new Error('SERVER_URL or FILE_SERVER_URL must be set in environment variables')
    }
    return serverUrl.replace(/\/$/, '')
}

/**
 * Verify "publicSignature" (from inline attach or /attach response) and return payload.
 * @param {string} signature
 * @param {string} fileClientId
 * @returns {object} verified payload
 */
function verifyPublicSignature (signature, fileClientId) {
    const secret = getClientSecret(fileClientId)
    const payload = jwt.verify(signature, secret, { algorithms: ['HS256'] })
    const { success } = parseAndValidateFileMetaSignature(payload)
    if (!success) throw new Error('Invalid file meta signature payload')
    return payload
}

/**
 * Verify "upload/share signature" that authorizes /attach.
 * Useful for server-to-server flows.
 * @param {string} signature
 * @param {string} fileClientId
 * @returns {object} decoded payload
 */
function verifyUploadSignature (signature, fileClientId) {
    const secret = getClientSecret(fileClientId)
    const decoded = jwt.verify(signature, secret, { algorithms: ['HS256'] })
    const { success } = validateFileUploadSignature(decoded)
    if (!success) throw new Error('Invalid upload signature payload')
    return decoded
}

/**
 * Upload files from server-side code (e.g., in tasks, services, etc.).
 * Makes HTTP request to /api/files/upload endpoint.
 *
 * @param {Object} options
 * @param {string} options.fileClientId - File client ID from config
 * @param {string} options.userId - User ID who owns the files
 * @param {string} options.fingerprint - Sender fingerprint
 * @param {Array<{stream: Readable, filename: string, mimetype: string, encoding?: string, size?: number}>} options.files - Files to upload
 * @param {string[]} options.modelNames - Allowed model names
 * @param {string} [options.organizationId] - Optional organization ID
 * @param {Object} [options.attach] - Optional inline attach: { itemId, modelName, dv, sender }
 * @param {string} [options.serverUrl] - Optional server URL override (defaults to SERVER_URL or FILE_SERVER_URL from env)
 * @param {string} [options.authorization] - Optional authorization value, that'll be used as value in headers.Authorization for authentication (service-to-service calls)
 * @returns {Promise<Array<{id: string, signature: string, attached?: boolean, publicSignature?: string}>>}
 */
async function uploadFilesFromServer ({
    fileClientId,
    userId,
    fingerprint,
    files,
    modelNames,
    organizationId,
    attach,
    serverUrl,
    authorization,
}) {
    if (!Array.isArray(files) || files.length === 0) {
        throw new Error('uploadFilesFromServer: "files" must be a non-empty array')
    }

    const baseUrl = serverUrl || getServerUrl()
    const meta = {
        dv: 1,
        sender: { dv: 1, fingerprint },
        user: { id: userId },
        fileClientId,
        modelNames,
        ...(organizationId && { organization: { id: organizationId } }),
    }

    const form = new FormData()

    for (const file of files) {
        if (file.stream) {
            form.append('file', file.stream, {
                filename: file.filename,
                contentType: file.mimetype,
            })
        } else if (file.buffer) {
            form.append('file', file.buffer, {
                filename: file.filename,
                contentType: file.mimetype,
            })
        } else {
            throw new Error('File must have either stream or buffer property')
        }
    }

    form.append('meta', JSON.stringify(meta))
    if (attach) {
        form.append('attach', JSON.stringify(attach))
    }

    const headers = {
        ...form.getHeaders(),
    }
    if (authorization) {
        headers['Authorization'] = authorization
    }

    const res = await fetch(`${baseUrl}/api/files/upload`, {
        method: 'POST',
        headers,
        body: form,
    })

    const json = await res.json()
    if (!res.ok) {
        throw new Error(`uploadFilesFromServer failed: ${res.status} ${JSON.stringify(json)}`)
    }

    return json.data.files
}

/**
 * Attach a previously uploaded/shared file to a model from server-side code.
 * Makes HTTP request to /api/files/attach endpoint.
 *
 * @param {Object} options
 * @param {string} options.signature - Upload/share signature from upload or share operation
 * @param {string} options.modelName - Target model name
 * @param {string} options.itemId - Target model record ID
 * @param {string} options.fileClientId - File client ID
 * @param {string} options.fingerprint - Sender fingerprint
 * @param {string} [options.serverUrl] - Optional server URL override (defaults to SERVER_URL or FILE_SERVER_URL from env)
 * @param {string} [options.authorization] - Optional authorization value, that'll be used as value in headers.Authorization for authentication (service-to-service calls)
 * @returns {Promise<{signature: string}>} - Public signature for the attached file
 */
async function attachFileFromServer ({
    signature,
    modelName,
    itemId,
    fileClientId,
    fingerprint,
    serverUrl,
    authorization,
}) {
    const baseUrl = serverUrl || getServerUrl()

    const payload = {
        dv: 1,
        sender: { dv: 1, fingerprint },
        modelName,
        itemId,
        fileClientId,
        signature,
    }

    const headers = {
        'Content-Type': 'application/json',
    }
    if (authorization) {
        headers['Authorization'] = authorization
    }

    const res = await fetch(`${baseUrl}/api/files/attach`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
        throw new Error(`attachFileFromServer failed: ${res.status} ${JSON.stringify(json)}`)
    }

    return json.data.file
}

/**
 * Share a file from server-side code.
 * Makes HTTP request to /api/files/share endpoint.
 *
 * @param {Object} options
 * @param {string} options.id - File record ID to share
 * @param {string} options.userId - Target user ID
 * @param {string} options.fileClientId - Target file client ID
 * @param {string} options.fingerprint - Sender fingerprint
 * @param {string[]} [options.modelNames] - Optional model names
 * @param {string} [options.serverUrl] - Optional server URL override (defaults to SERVER_URL or FILE_SERVER_URL from env)
 * @param {string} [options.authorization] - Optional authorization value, that'll be used as value in headers.Authorization for authentication (service-to-service calls)
 * @returns {Promise<{id: string, signature: string}>}
 */
async function shareFileFromServer ({
    id,
    userId,
    fileClientId,
    fingerprint,
    modelNames,
    serverUrl,
    authorization,
}) {
    const baseUrl = serverUrl || getServerUrl()

    const payload = {
        dv: 1,
        sender: { dv: 1, fingerprint },
        id,
        user: { id: userId },
        fileClientId,
        ...(modelNames && { modelNames }),
    }

    const headers = {
        'Content-Type': 'application/json',
    }
    if (authorization) {
        headers['Authorization'] = authorization
    }

    const res = await fetch(`${baseUrl}/api/files/share`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
        throw new Error(`shareFileFromServer failed: ${res.status} ${JSON.stringify(json)}`)
    }

    return json.data.file
}

module.exports = {
    verifyPublicSignature,
    verifyUploadSignature,
    uploadFilesFromServer,
    attachFileFromServer,
    shareFileFromServer,
}



