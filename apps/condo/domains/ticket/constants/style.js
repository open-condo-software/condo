const { CANCELED, COMPLETED, DEFERRED, NEW_OR_REOPEND, PROCESSING, CLOSED } = require('./statusTypes')

const STATUS_SELECT_COLORS = {
    [NEW_OR_REOPEND]: {
        primary: '#FA8C16',
        secondary: '#FFFB8F',
        additional: '#FFF566',
    },
    [PROCESSING]: {
        primary: '#AD6800',
        secondary: '#FFD591',
        additional: '#FFC069',
    },
    [COMPLETED]: {
        primary: '#237804',
        secondary: '#B7EB8F',
        additional: '#95DE64',
    },
    [CLOSED]: {
        primary: '#000000',
        secondary: '#D9D9D9',
        additional: '#BFBFBF',
    },
    [DEFERRED]: {
        primary: '#D4380D',
        secondary: '#FFCCC7',
        additional: '#FFA39E',
    },
    [CANCELED]: {
        primary: '#595959',
        secondary: '#D9D9D9',
        additional: '#BFBFBF',
    },
}

/**
 * This is colors of ant's tags
 * @link https://ant.design/components/tag/
 */
const TICKET_TYPE_TAG_COLORS = {
    emergency: 'red',
    paid: 'orange',
    warranty: 'purple',
}

module.exports = {
    TICKET_TYPE_TAG_COLORS,
    STATUS_SELECT_COLORS,
}
