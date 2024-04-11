const { MESSAGE_TYPES } = require('@condo/domains/notification/constants/constants')

function getMaxLength () {
    const maxTypeLength = Math.max(...MESSAGE_TYPES.map(t => t.length))
    let pow = 0
    while (Math.pow(2, pow) < maxTypeLength) {
        pow++
    }

    return Math.pow(2, pow)
}

function getMessageTypeField ({ isRequired, ...extraAttrs }) {
    return {
        type: 'Select',
        options: MESSAGE_TYPES,
        graphQLReturnType: 'MessageType',
        isRequired,
        kmigratorOptions: { null: !isRequired, max_length: getMaxLength() },
        ...extraAttrs,
    }
}



module.exports = {
    getMessageTypeField,
}