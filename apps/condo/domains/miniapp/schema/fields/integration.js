const { Text, File } = require('@keystonejs/fields')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')

const APPS_FILE_ADAPTER = new FileAdapter('apps')

const DEVELOPER_FIELD = {
    schemaDoc: 'Developer company name',
    type: Text,
    isRequired: true,
}

const LOGO_FIELD = {
    schemaDoc: 'Integration company logo',
    type: File,
    isRequired: false,
    adapter: APPS_FILE_ADAPTER,
}

const PARTNER_URL_FIELD = {
    schemaDoc: 'Integration company website',
    type: Text,
    isRequired: false,
}

module.exports = {
    DEVELOPER_FIELD,
    LOGO_FIELD,
    PARTNER_URL_FIELD,
}

