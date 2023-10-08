const Ajv = require('ajv')

const { SbbolUserInfoSchema } = require('../constants')

function getSbbolUserInfoErrors (userInfo) {
    const ajv = new Ajv()
    ajv.validate(SbbolUserInfoSchema, userInfo)
    return (ajv.errors) ? ajv.errors.map(x => x.message) : []
}

module.exports = {
    getSbbolUserInfoErrors,
}