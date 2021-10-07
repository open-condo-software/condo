const { SBBOL_IMPORT_NAME } = require('./common')

const dvSenderFields = {
    dv: 1,
    sender: { dv: 1, fingerprint: `import-${SBBOL_IMPORT_NAME}` },
}

module.exports = {
    dvSenderFields,
}