const KEYWORDS = {
    parking: ['parking', 'garage', 'space'],
    apartment: ['apt', 'apartment', 'unit', 'suite', '#'],
    commercial: ['office', 'suite', 'unit'],
    warehouse: ['storage', 'basement', 'warehouse', 'locker'],
    flat: ['flat', 'room', 'unit'],
}

const HOUSE_IDENTIFIERS = 'house|lot|parcel|unit|building|blg|address|st|rd|ave|dr|ln|court|ct|pl|plaza|way|terrace|ter'
const DEFAULT_UNIT = 'flat 1'

module.exports = {
    KEYWORDS,
    HOUSE_IDENTIFIERS,
    DEFAULT_UNIT,
}



