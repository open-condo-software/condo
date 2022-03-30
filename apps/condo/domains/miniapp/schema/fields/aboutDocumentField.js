const { Json } = require('@core/keystone/fields')

const ABOUT_DOCUMENT_FIELD = {
    schemaDoc: 'JSON interpretation of visual about app field written in KS6 document-field notation',
    type: Json,
    isRequired: false,
}

module.exports = {
    ABOUT_DOCUMENT_FIELD,
}