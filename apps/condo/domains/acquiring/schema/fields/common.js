const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

const ACQUIRING_FILE_ADAPTER = new FileAdapter('AcquiringIntegration')

const LOGO_FIELD = {
    schemaDoc: 'Logo of integration\'s company or integration itself',
    type: 'File',
    isRequired: false,
    adapter: ACQUIRING_FILE_ADAPTER,
}


const SHORT_DESCRIPTION_FIELD = {
    schemaDoc: 'Short description / catch phrase providing information about integration functionality. Will be shown on integration\'s card',
    type: 'Text',
    isRequired: false,
}


const DISPLAY_PRIORITY_FIELD = {
    schemaDoc: 'The number used to determine the position of the integration among the others. ',
    type: 'Integer',
    isRequired: true,
    defaultValue: 1,
}


module.exports = {
    LOGO_FIELD,
    SHORT_DESCRIPTION_FIELD,
    ACQUIRING_FILE_ADAPTER,
    DISPLAY_PRIORITY_FIELD,
}
