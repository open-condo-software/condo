const { readFile } = require('fs/promises')
const path = require('path')
const { Readable } = require('stream')

const { Implementation } = require('@open-keystone/fields')
const cuid = require('cuid')


const { isFileMeta } = require('@open-condo/keystone/utils/externalContentFieldType')

const DEFAULT_FORMAT = 'json'

const DEFAULT_PROCESSORS = {
    json: {
        graphQLInputType: 'JSON',
        graphQLReturnType: 'JSON',
        serialize: (value) => JSON.stringify(value ?? null),
        deserialize: (raw) => (raw.length === 0 ? null : JSON.parse(raw)),
        mimetype: 'application/json',
        fileExt: 'json',
    },
    xml: {
        graphQLInputType: 'String',
        graphQLReturnType: 'String',
        serialize: (value) => (value == null ? '' : String(value)),
        deserialize: (raw) => (raw.length === 0 ? null : raw),
        mimetype: 'application/xml',
        fileExt: 'xml',
    },
    text: {
        graphQLInputType: 'String',
        graphQLReturnType: 'String',
        serialize: (value) => (value == null ? '' : String(value)),
        deserialize: (raw) => (raw.length === 0 ? null : raw),
        mimetype: 'text/plain',
        fileExt: 'txt',
    },
}

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
 * @param {{ filename: string }} fileMeta Stored file-meta object (must contain filename)
 * @returns {Promise<Buffer>}
 */
async function readFromAdapter (adapter, fileMeta) {
    const filename = fileMeta.filename

    // Local adapter (from `packages/keystone/fileAdapter/fileAdapter.js`)
    if (typeof adapter?.src === 'string') {
        const fullPath = path.join(adapter.src, filename)
        return Buffer.from(await readFile(fullPath))
    }

    // Cloud adapters provide acl.generateUrl which returns a signed, time-limited direct URL.
    // It does not require auth cookies (unlike indirect /api/files/... urls from publicUrl()).
    if (adapter?.acl && typeof adapter.acl.generateUrl === 'function' && adapter.folder) {
        const directUrl = adapter.acl.generateUrl({
            filename: `${adapter.folder}/${filename}`,
        })
        const res = await fetch(directUrl)
        if (!res.ok) {
            throw new Error(`ExternalContent: fetch failed with status ${res.status}`)
        }
        const buf = Buffer.from(await res.arrayBuffer())
        return buf
    }

    throw new Error('ExternalContent: unsupported file adapter for read')
}

class ExternalContentImplementation extends Implementation {
    constructor (path, options = {}, meta = {}) {
        // IMPORTANT: pass through the original keystone options/meta.
        // Base `@open-keystone/fields` Implementation relies on meta (e.g. getListByKey).
        super(path, options, meta)

        const {
            adapter,
            format = DEFAULT_FORMAT,
            processors = {},
            graphQLInputType,
            graphQLReturnType,
            mimetype,
            fileExt,
            serialize,
            deserialize,
        } = options

        if (!adapter) {
            throw new Error(`ExternalContent: "adapter" is required for ${path}`)
        }

        const byFormat = { ...DEFAULT_PROCESSORS, ...processors }
        const cfg = byFormat[format]
        if (!cfg) {
            throw new Error(`ExternalContent: unknown format "${format}" for ${path}`)
        }

        this.fileAdapter = adapter
        this.format = format

        this.graphQLInputType = graphQLInputType || cfg.graphQLInputType
        this.graphQLReturnType = graphQLReturnType || cfg.graphQLReturnType
        this.mimetype = mimetype || cfg.mimetype
        this.fileExt = fileExt || cfg.fileExt
        this.serialize = serialize || cfg.serialize
        this.deserialize = deserialize || cfg.deserialize
    }

    // GQL Output
    gqlOutputFields () {
        return [`${this.path}: ${this.graphQLReturnType}`]
    }

    gqlOutputFieldResolvers () {
        return {
            [this.path]: async (item) => {
                const value = item?.[this.path]
                if (value === null || typeof value === 'undefined') return value

                // Backward compatibility: old `Json` field stored raw object directly in DB
                if (!isFileMeta(value)) return value

                const buf = await readFromAdapter(this.fileAdapter, value)
                const raw = buf.toString('utf-8')
                return this.deserialize(raw)
            },
        }
    }

    // GQL Input
    gqlQueryInputFields () {
        // We store only a file reference in DB, so query by content is not supported.
        return []
    }

    gqlUpdateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    gqlCreateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    // Hooks
    async resolveInput ({ resolvedData, existingItem, listKey }) {
        const nextValue = resolvedData[this.path]

        if (typeof nextValue === 'undefined') return undefined

        const prevValue = existingItem?.[this.path]
        const prevLooksLikeFile = isFileMeta(prevValue)

        if (nextValue === null) {
            if (prevLooksLikeFile) {
                try {
                    await this.fileAdapter.delete(prevValue)
                } catch {
                    // ignore delete errors
                }
            }
            return null
        }

        // Save first, then delete old file.
        // This prevents losing the previous file if save() fails.
        const payload = this.serialize(nextValue)
        const stream = Readable.from([Buffer.from(String(payload), 'utf-8')])

        const prefix = listKey || 'item'
        const originalFilename = `${prefix}_${this.path}.${this.fileExt}`
        const saved = await this.fileAdapter.save({
            stream,
            filename: originalFilename,
            mimetype: this.mimetype,
            encoding: 'utf-8',
            id: cuid(),
            meta: { format: this.format },
        })

        if (prevLooksLikeFile) {
            try {
                await this.fileAdapter.delete(prevValue)
            } catch {
                // ignore delete errors
            }
        }

        return saved
    }
}

module.exports = {
    ExternalContentImplementation,
}

