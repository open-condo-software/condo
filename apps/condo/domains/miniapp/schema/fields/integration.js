const { Text, File, Relationship } = require('@keystonejs/fields')
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

const APP_IMAGE_FIELD = {
    schemaDoc: 'Image',
    type: File,
    isRequired: true,
    adapter: APPS_FILE_ADAPTER,
}

const DESCRIPTION_BLOCKS_FIELD = {
    schemaDoc: 'Link to app description blocks if exists...You can control order of appearance in CRM by specifying theirs order parameter',
    type: Relationship,
    ref: 'DescriptionBlock',
    isRequired: false,
    many: true,
}

const SHORT_DESCRIPTION_FIELD = {
    schemaDoc: 'Short integration description, that would be shown on settings card',
    type: Text,
    isRequired: true,
}

module.exports = {
    DEVELOPER_FIELD,
    LOGO_FIELD,
    PARTNER_URL_FIELD,
    APP_IMAGE_FIELD,
    DESCRIPTION_BLOCKS_FIELD,
    SHORT_DESCRIPTION_FIELD,
}

