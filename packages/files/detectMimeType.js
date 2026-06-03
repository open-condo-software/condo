const { fromFile } = require('file-type')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('detect-mime-type')

async function detectMimeTypeFromFile (filepath) {
    if (!filepath) return null

    try {
        const result = await fromFile(filepath)
        return result?.mime || null
    } catch (err) {
        logger.warn({ msg: 'Failed to detect mimetype from file', err, data: { filepath } })
        return null
    }
}

module.exports = {
    detectMimeTypeFromFile,
}
