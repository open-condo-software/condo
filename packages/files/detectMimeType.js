const { fromFile } = require('file-type')

async function detectMimeTypeFromFile (filepath) {
    if (!filepath) return null
    const result = await fromFile(filepath)
    return result?.mime || null
}

module.exports = {
    detectMimeTypeFromFile,
}
