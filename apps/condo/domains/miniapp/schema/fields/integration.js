const { Text, File } = require('@keystonejs/fields')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { Markdown } = require('@keystonejs/fields-markdown')

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

const SHORT_DESCRIPTION_FIELD = {
    schemaDoc: 'Short integration description, that would be shown on settings card',
    type: Text,
    isRequired: true,
}

const INSTRUCTION_TEXT_FIELD = {
    schemaDoc: 'Text which used to describe how to connect app written in markdown',
    type: Markdown,
    isRequired: false,
}

const IFRAME_URL_FIELD = {
    schemaDoc: 'Url to app page, which will is app starting point and will be opened in iframe',
    type: Text,
    isRequired: false,
}

const CONNECTED_MESSAGE_FIELD = {
    schemaDoc: 'Short message which will be displayed on app\'s index page if it has no appUrl. Required if appUrl is not specified',
    type: Markdown,
    isRequired: false,
}

module.exports = {
    DEVELOPER_FIELD,
    LOGO_FIELD,
    PARTNER_URL_FIELD,
    APP_IMAGE_FIELD,
    SHORT_DESCRIPTION_FIELD,
    INSTRUCTION_TEXT_FIELD,
    IFRAME_URL_FIELD,
    CONNECTED_MESSAGE_FIELD,
    APPS_FILE_ADAPTER,
}

