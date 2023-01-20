const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const { Json } = require('@open-condo/keystone/fields')

const { getValidator } = require('@condo/domains/common/schema/json.utils')

const GalleryJSONSchema = {
    type: ['array', 'null'],
    items: {
        type: 'string',
        format: 'uri',
        pattern: '^https?://',
    },
}

const ajv = new Ajv()
addFormats(ajv)
const GalleryJSONValidator = ajv.compile(GalleryJSONSchema)
const validateGallery = getValidator(GalleryJSONValidator)

const GALLERY_FIELD = {
    schemaDoc: 'Array containing links to promotional images, which will be shown to user on app\'s page',
    type: Json,
    isRequired: false,
    graphQLInputType: '[String!]',
    graphQLReturnType: '[String!]',
    hooks: {
        validateInput: validateGallery,
    },
}

module.exports = {
    GALLERY_FIELD,
}
