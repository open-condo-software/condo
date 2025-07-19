const { MESSAGE_TYPES } = require('@condo/domains/notification/constants/constants')

function getMessageTypeField ({ isRequired, ...extraAttrs }) {
    return {
        type: 'Select',
        options: MESSAGE_TYPES,
        dataType: 'string',
        graphQLReturnType: 'MessageType',
        isRequired,
        ...extraAttrs,
    }
}



module.exports = {
    getMessageTypeField,
}