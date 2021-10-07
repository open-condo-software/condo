const { SBBOL_IMPORT_NAME } = require('./common')

export const dvSenderFields = {
    dv: 1,
    sender: { dv: 1, fingerprint: `import-${SBBOL_IMPORT_NAME}` },
}