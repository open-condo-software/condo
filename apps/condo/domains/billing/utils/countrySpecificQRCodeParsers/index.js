const get = require('lodash/get')

const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')

const ruParser = require('./ru.qrCodeParser')

/**
 * @type {{[countryCode: string]: (qrCode: string) => Object<string, unknown>}}
 */
const countrySpecificParsers = {
    [RUSSIA_COUNTRY]: ruParser,
}

/**
 * Returns country specific parser or empty one.
 * @param {string} country
 * @return {(qrCode: string) => Object<string, unknown>}
 */
const getCountrySpecificQRCodeParser = (country) => {
    const defaultParser = () => ({})

    return get(countrySpecificParsers, country, defaultParser)
}

module.exports = {
    getCountrySpecificQRCodeParser,
}
