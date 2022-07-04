const { Text, File, Checkbox, Select } = require('@keystonejs/fields')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { Markdown } = require('@keystonejs/fields-markdown')
const { CONTEXT_STATUSES, CONTEXT_IN_PROGRESS_STATUS } = require('@condo/domains/miniapp/constants')

const APPS_FILE_ADAPTER = new FileAdapter('apps')

const DEVELOPER_FIELD = {
    schemaDoc: 'Developer company name',
    type: Text,
    isRequired: true,
}

const LOGO_FIELD = {
    schemaDoc: 'Logo of app\'s company or app itself',
    type: File,
    isRequired: false,
    adapter: APPS_FILE_ADAPTER,
}

const PARTNER_URL_FIELD = {
    schemaDoc: 'Link to the website of the developer company, where the user can find out detailed information about the partner',
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
    schemaDoc: 'Short description providing information about integration functionality. Will be shown on App\'s card',
    type: Text,
    isRequired: true,
}

const INSTRUCTION_TEXT_FIELD = {
    schemaDoc: 'Text which used to describe how to connect app written in markdown. Required if appUrl is not specified',
    type: Markdown,
    isRequired: false,
}

const IFRAME_URL_FIELD = {
    schemaDoc: 'Url to app page, which is the app starting point and will be opened in iframe',
    type: Text,
    isRequired: false,
}

const CONNECTED_MESSAGE_FIELD = {
    schemaDoc: 'Short message which will be displayed on app\'s index page if it has no appUrl. Required if appUrl is not specified',
    type: Markdown,
    isRequired: false,
}

const IS_HIDDEN_FIELD = {
    schemaDoc: 'Indicates whether the integration or app is hidden inside the CRM. Used if integration is active by default or not ready to appear inside CRM',
    type: Checkbox,
    defaultValue: false,
    isRequired: true,
}

const CONTEXT_DEFAULT_STATUS_FIELD = {
    schemaDoc: 'Status, which context will have by default after creation if no overwriting option provided',
    isRequired: true,
    type: Select,
    dataType: 'string',
    options: CONTEXT_STATUSES,
    defaultValue: CONTEXT_IN_PROGRESS_STATUS,
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
    IS_HIDDEN_FIELD,
    CONTEXT_DEFAULT_STATUS_FIELD,
}

