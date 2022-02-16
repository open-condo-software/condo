const { CANCELED, COMPLETED, DEFERRED, NEW_OR_REOPEND, PROCESSING, CLOSED } = require('./statusTypes')

const STATUS_SELECT_COLORS = {
    [NEW_OR_REOPEND]: {
        primary: '#FFFFFF',
        secondary: '#EB3468',
        additional: '#FFFFFF',
    },
    [PROCESSING]: {
        primary: '#FFFFFF',
        secondary: '#F08633',
        additional: '#FFC069',
    },
    [COMPLETED]: {
        primary: '#FFFFFF',
        secondary: '#33CE66',
        additional: '#95DE64',
    },
    [CLOSED]: {
        primary: '#FFFFFF',
        secondary: '#159A41',
        additional: '#BFBFBF',
    },
    [DEFERRED]: {
        primary: '#FFFFFF',
        secondary: '#3786C7',
        additional: '#FFA39E',
    },
    [CANCELED]: {
        primary: '#FFFFFF',
        secondary: '#B4710D',
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
