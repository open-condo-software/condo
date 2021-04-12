const { CANCELED, COMPLETED, DEFERRED, NEW_OR_REOPEND, PROCESSING, CLOSED } = require('./statusTypes')
const { grey, green, orange, red, yellow  } = require('@ant-design/colors')
const { colors } = require('@condo/domains/common/constants/style')

const STATUS_SELECT_COLORS = {
    [NEW_OR_REOPEND]: {
        color: yellow[9],
        backgroundColor: yellow[2],
    },
    [PROCESSING]: {
        color: orange[8],
        backgroundColor: orange[4],
    },
    [CANCELED]: {
        color: grey[9],
        backgroundColor: colors.lightGrey[5],
    },
    [COMPLETED]: {
        color: green[8],
        backgroundColor: green[3],
    },
    [DEFERRED]: {
        color: red[6],
        backgroundColor: red[2],
    },
    [CLOSED]: {
        color: grey[6],
        backgroundColor: colors.lightGrey[6],
    },
}

module.exports = {
    STATUS_SELECT_COLORS,
}
