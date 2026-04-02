const { readFile } = require('fs/promises')

const { fetch } = require('@open-condo/keystone/fetch')

const { validateFilePath } = require('./validateFilePath')

/**
 * Reads file contents for ExternalContent field from the provided adapter.
 *
 * Why not just `fetch(file.publicUrl)`?
 * - `publicUrl()` often returns an indirect URL like `/api/files/...` served by our app.
 * - Those endpoints frequently require authentication (cookie / Authorization / signature).
 * - Field resolvers do not have a browser session and should not depend on request-specific auth.
 *
 * Therefore:
 * - For cloud adapters we use `adapter.acl.generateUrl(...)` to get a short-lived signed *direct* URL
 *   (S3/OBS), and fetch bytes from it without cookies.
 * - For local adapter we read from filesystem directly via `adapter.src`.
 *
 * @param {*} adapter File adapter instance passed into field config
 * @param {{ filename: string, mimetype?: string, originalFilename?: string }} fileMeta Stored file-meta object
 * @returns {Promise<Buffer>}
 */
async function readFromAdapter (adapter, fileMeta) {
    const filename = fileMeta.filename

    // Local adapter (from `packages/keystone/fileAdapter/fileAdapter.js`)
    if (typeof adapter?.src === 'string') {
        const fullPath = validateFilePath(adapter.src, filename)
        return Buffer.from(await readFile(fullPath))
    }

    // Cloud adapters provide acl.generateUrl which returns a signed, time-limited direct URL.
    // It does not require auth cookies (unlike indirect /api/files/... urls from publicUrl()).
    if (adapter?.acl && typeof adapter.acl.generateUrl === 'function' && adapter.folder) {
        const directUrl = adapter.acl.generateUrl({
            filename: `${adapter.folder}/${filename}`,
            mimetype: fileMeta.mimetype,
            originalFilename: fileMeta.originalFilename,
        })
        
        if (!directUrl || typeof directUrl !== 'string') {
            throw new Error(`Invalid URL generated for file: ${filename}`)
        }
        
        try {
            const res = await fetch(directUrl)
            if (!res.ok) {
                throw new Error(`Fetch failed with status ${res.status} for file: ${filename}`)
            }
            const buf = Buffer.from(await res.arrayBuffer())
            return buf
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            error.message = `ExternalContent: failed to read file ${filename}: ${error.message}`
            throw error
        }
    }

    throw new Error('ExternalContent: unsupported file adapter for read')
}

module.exports = {
    readFromAdapter,
}
