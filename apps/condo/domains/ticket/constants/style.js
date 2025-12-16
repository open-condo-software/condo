const { colors: uiColors } = require('@open-condo/ui/colors')

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

const COMMON_TAG_STYLES = { border: 'none', fontSize: '12px', padding: '2px 10px', fontWeight: 600 }
const TICKET_TYPE_TAG_STYLE = {
    emergency: { ...COMMON_TAG_STYLES, color: uiColors.pink[7], backgroundColor: uiColors.pink[1] },
    payable: { ...COMMON_TAG_STYLES, color: uiColors.teal[7], backgroundColor: uiColors.teal[1] },
    warranty: { ...COMMON_TAG_STYLES, color: uiColors.purple[7], backgroundColor: uiColors.purple[1] },
    returned: { ...COMMON_TAG_STYLES, color: uiColors.brown[7], backgroundColor: uiColors.brown[1] },
    supervised: { ...COMMON_TAG_STYLES, color: uiColors.blue[7], backgroundColor: uiColors.blue[1] },
    escalated: { ...COMMON_TAG_STYLES, color: uiColors.white, backgroundColor: uiColors.red[7] },
}

const TICKET_CARD_LINK_STYLE = { color: colors.black, textDecoration: 'underline', textDecorationColor: colors.lightGrey[5] }

module.exports = {
    TICKET_TYPE_TAG_STYLE,
    STATUS_SELECT_COLORS,
    TICKET_CARD_LINK_STYLE,
}
