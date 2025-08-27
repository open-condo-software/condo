const { FileRecord, FILE_RECORD_META_FIELDS } = require('./FileRecord')

const getFileModels = () => {
    return { FileRecord }
}

module.exports = {
    getFileModels,
    FILE_RECORD_META_FIELDS,
}
