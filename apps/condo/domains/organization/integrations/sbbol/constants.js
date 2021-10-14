const { SBBOL_IMPORT_NAME } = require('./common')

const dvSenderFields = {
    dv: 1,
    sender: { dv: 1, fingerprint: `import-${SBBOL_IMPORT_NAME}` },
}

const BANK_OPERATION_CODE = {
    BUYING: '06',
}

module.exports = {
    dvSenderFields,
    BANK_OPERATION_CODE,
}