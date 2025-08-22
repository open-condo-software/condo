const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')

const FileRecord = generateServerUtils('FileRecord')

module.exports = {
    FileRecord,
}
