const { PassThrough } = require('stream')

const archiver = require('archiver')
const unzipper = require('unzipper')

/**
 * @typedef {NodeJS.ReadableStream | Buffer | string} ZipEntrySource
 */

/**
 * @typedef {{ path: string, type: string, entry: object, stream: NodeJS.ReadableStream }} ZipEntryContext
 */

/**
 * @typedef {{
 *   match?: (ctx: ZipEntryContext) => boolean | Promise<boolean>,
 *   process?: (ctx: ZipEntryContext) => ZipEntrySource | { path?: string, source?: ZipEntrySource, options?: object } | null | undefined | Promise<ZipEntrySource | { path?: string, source?: ZipEntrySource, options?: object } | null | undefined>
 * }} EntryDescriptor
 */

/**
 * @typedef {{
 *   path?: string,
 *   name?: string,
 *   source?: ZipEntrySource,
 *   content?: ZipEntrySource,
 *   stream?: NodeJS.ReadableStream,
 *   options?: object
 * }} AppendDescriptor
 */

/**
 * @typedef {{
 *   append: (descriptor: AppendDescriptor) => void,
 *   hasEntry: (path: string) => boolean,
 *   entriesPaths: Set<string>
 * }} AfterEntriesContext
 */

/**
 * @param {*} value
 * @returns {boolean}
 */
function isReadableStream (value) {
    return value && typeof value.pipe === 'function'
}

/**
 * Validates a zip entry path against common path-traversal attack patterns.
 * Throws if the path is invalid or unsafe (absolute, backslash, null byte,
 * Windows drive prefix, or `..` segment).
 * @param {string} entryPath
 * @returns {true}
 */
function validateZipEntryPath (entryPath) {
    if (typeof entryPath !== 'string' || !entryPath) {
        throw new Error(`Invalid zip entry path: ${entryPath}`)
    }

    if (entryPath.includes('\0') || entryPath.includes('\\') || entryPath.startsWith('/') || /^[A-Z]:/i.test(entryPath)) {
        throw new Error(`Unsafe zip entry path: ${entryPath}`)
    }

    const pathSegments = entryPath.replace(/\/+/g, '/').split('/')
    if (pathSegments.includes('..')) {
        throw new Error(`Unsafe zip entry path: ${entryPath}`)
    }

    return true
}

/**
 * Returns the entry path with a trailing slash if it's a directory.
 * @param {string} entryPath - The entry path to process.
 * @returns {string} The entry path with a trailing slash if it's a directory.
 */
function getDirectoryEntryPath (entryPath) {
    return entryPath.endsWith('/') ? entryPath : `${entryPath}/`
}

/**
 * Extracts the source to write as entry content from an append descriptor.
 * Prefers `content` (even if falsy) over `source` over `stream`, falling back to an empty string.
 * @param {AppendDescriptor} params
 * @returns {ZipEntrySource}
 */
function getAppendSource (params) {
    const { content, source, stream } = params

    if (Object.hasOwn(params, 'content')) {
        return content
    }

    if (source) {
        return source
    }

    if (stream) {
        return stream
    }

    return ''
}

/**
 * Normalizes the return value of a user-supplied `process` callback into a
 * consistent internal shape `{ source, path, name, options }` for archiver.
 * @param {*} result - The raw value returned by the `process` callback.
 * @param {NodeJS.ReadableStream} entry - The original unzipper entry stream, used as passthrough fallback.
 * @returns {{ source: ZipEntrySource, path?: string, name?: string, options?: object } | null}
 */
function normalizeProcessorResult (result, entry) {
    if (typeof result === 'undefined') {
        return { source: entry }
    }

    if (result === null) {
        return null
    }

    if (typeof result === 'string' || Buffer.isBuffer(result) || isReadableStream(result)) {
        return { source: result }
    }

    if (typeof result === 'object') {
        return {
            name: result.name,
            path: result.path,
            options: result.options,
            source: getAppendSource(result),
        }
    }

    return { source: String(result) }
}

/**
 * Creates the `append` helper passed to `afterEntries`.
 * @param {{ archive: object, entriesPaths: Set<string> }} params
 * @returns {(descriptor: AppendDescriptor) => void}
 */
function createAppend ({ archive, entriesPaths }) {
    return function append ({ path, name, content, source, stream, options = {} }) {
        const entryPath = path || name

        validateZipEntryPath(entryPath)
        entriesPaths.add(entryPath)

        archive.append(getAppendSource({ content, source, stream }), {
            ...options,
            name: entryPath,
        })
    }
}

/**
 * Walks the entry descriptors and returns the result of the first matching processor,
 * or the original entry stream if nothing matches.
 * @param {{ entry: NodeJS.ReadableStream, entries: EntryDescriptor[], context: ZipEntryContext }} params
 * @returns {Promise<*>}
 */
async function getProcessorResult ({ entry, entries, context }) {
    for (const descriptor of entries) {
        const { match, process } = descriptor

        if (!match || await match(context)) {
            return process ? await process(context) : entry
        }
    }

    return entry
}

/**
 * Reads a zip from `inputStream`, optionally transforms individual entries,
 * optionally appends new entries, and returns a new readable stream of the
 * rewritten zip. Processing happens asynchronously after the function returns;
 * any error during rewriting destroys the returned stream with that error.
 *
 * @param {NodeJS.ReadableStream} inputStream - Readable stream of the source zip.
 * @param {object} [options]
 * @param {EntryDescriptor[]} [options.entries=[]]
 *   Per-entry transform descriptors, tested in order. The first descriptor
 *   whose `match` returns truthy is applied. Omitting `match` matches every
 *   entry. `process` can return:
 *   - a stream / Buffer / string — used as the new entry content at the same path
 *   - an object `{ path, source, options }` — full control over name and archiver options
 *   - `null` — drops the entry from the output zip
 *   - `undefined` — passes the entry through unchanged
 * @param {(ctx: AfterEntriesContext) => void | Promise<void>} [options.afterEntries]
 *   Called once after all original entries have been processed. Use `append`
 *   to inject new files (e.g. create-if-missing behaviour).
 * @param {object} [options.archiverOptions={ zlib: { level: 9 } }]
 *   Options forwarded to `archiver('zip', ...)`.
 * @returns {NodeJS.ReadableStream} Readable stream of the rewritten zip.
 */
function modifyZipStream (inputStream, options = {}) {
    const {
        entries = [],
        afterEntries,
        archiverOptions = { zlib: { level: 9 } },
    } = options

    const outputStream = new PassThrough()
    const archive = archiver('zip', archiverOptions)
    const entriesPaths = new Set()

    archive.on('error', (error) => {
        outputStream.destroy(error)
    })
    archive.pipe(outputStream)

    Promise.resolve().then(async () => {
        const append = createAppend({ archive, entriesPaths })
        const parser = inputStream.pipe(unzipper.Parse({ forceStream: true }))

        for await (const entry of parser) {
            const entryPath = entry.path

            validateZipEntryPath(entryPath)
            entriesPaths.add(entryPath)

            // NOTE: Preserving directory entries to keep the output zip structurally identical to the input.
            if (entry.type === 'Directory') {
                entry.autodrain()
                archive.append('', { name: getDirectoryEntryPath(entryPath) })
                continue
            }

            // NOTE: Non-files (symlinks and etc) are skipped
            if (entry.type !== 'File') {
                entry.autodrain()
                continue
            }

            const context = {
                path: entryPath,
                type: entry.type,
                entry,
                stream: entry,
            }
            const result = normalizeProcessorResult(
                await getProcessorResult({ entry, entries, context }),
                entry,
            )

            if (result === null) {
                entry.autodrain()
                continue
            }

            const resultPath = result.path || result.name || entryPath

            validateZipEntryPath(resultPath)
            archive.append(result.source, {
                ...result.options,
                name: resultPath,
            })
        }

        if (afterEntries) {
            await afterEntries({
                append,
                hasEntry: (entryPath) => entriesPaths.has(entryPath),
                entriesPaths,
            })
        }

        await archive.finalize()
    }).catch((error) => {
        archive.abort()
        outputStream.destroy(error)

        if (typeof inputStream.destroy === 'function') {
            inputStream.destroy(error)
        }
    })

    return outputStream
}

module.exports = {
    modifyZipStream,
}