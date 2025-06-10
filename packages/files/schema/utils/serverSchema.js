const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')

const CondoFile = generateServerUtils('CondoFile')

module.exports = {
    CondoFile,
}
