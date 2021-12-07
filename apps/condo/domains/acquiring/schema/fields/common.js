const { Text } = require('@keystonejs/fields')

const IMPORT_ID_FIELD = {
    schemaDoc: 'Id of `acquiring object` which represents current item in base of external service. Used for internal needs of `acquiring integration service`',
    type: Text,
    isRequired: false,
}

module.exports = {
    IMPORT_ID_FIELD,
}