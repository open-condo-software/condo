const { AddressMetaJSONSchema } = require('../../common/utils/addressApi/AddressMetaSchema')
const Ajv = require('ajv')
const ajv = new Ajv()

const jsonAddressMetaValidator = ajv.compile(AddressMetaJSONSchema)

module.exports = {
    jsonAddressMetaValidator,
}