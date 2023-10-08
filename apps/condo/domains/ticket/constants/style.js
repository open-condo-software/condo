const { colors } = require('@condo/domains/common/constants/style')

const { CANCELED, COMPLETED, DEFERRED, NEW_OR_REOPEND, PROCESSING, CLOSED } = require('./statusTypes')

const STATUS_SELECT_COLORS = {
    [NEW_OR_REOPEND]: {
        primary: '#EB3468',
        secondary: '#FFFFFF',
        additional: '#FFFFFF',
    },
    [PROCESSING]: {
        primary: '#FF9500',
        secondary: '#FFFFFF',
        additional: '#FFC069',
    },
    [COMPLETED]: {
        primary: '#39CE66',
        secondary: '#FFFFFF',
        additional: '#95DE64',
    },
    [CLOSED]: {
        primary: '#1C7E79',
        secondary: '#FFFFFF',
        additional: '#BFBFBF',
    },
    [DEFERRED]: {
        primary: '#2696F3',
        secondary: '#FFFFFF',
        additional: '#FFA39E',
    },
    [CANCELED]: {
        primary: '#B4710D',
        secondary: '#FFFFFF',
        additional: '#BFBFBF',
    },
}

/**
 * This is colors of ant's tags
 * @link https://ant.design/components/tag/
 */
const TICKET_TYPE_TAG_COLORS = {
    emergency: 'red',
    payable: 'orange',
    warranty: 'purple',
    returned: 'volcano',
}

const TICKET_CARD_LINK_STYLE = { color: colors.black, textDecoration: 'underline', textDecorationColor: colors.lightGrey[5] }

module.exports = {
    TICKET_TYPE_TAG_COLORS,
    STATUS_SELECT_COLORS,
    TICKET_CARD_LINK_STYLE,
}
