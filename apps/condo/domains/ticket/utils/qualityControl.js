const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')


const { QUALITY_CONTROL_BAD_OPTIONS, QUALITY_CONTROL_GOOD_OPTIONS, QUALITY_CONTROL_VALUES_BY_KEY } = require('@condo/domains/ticket/constants/qualityControl')

const convertQualityControlOptionsToText = (options, optionsMessages) => {
    if (!isArray(options) || isEmpty(options) || isEmpty(optionsMessages)) return null
    const selectedOptions = options.map((key) => optionsMessages[key])
    if (selectedOptions.length < 1) return null
    return selectedOptions.join(', ')
}

const filterQualityControlOptionsByScore = (score, options) => {
    if (!isArray(options) || isEmpty(options)) return []
    if (score === QUALITY_CONTROL_VALUES_BY_KEY.BAD) {
        return options.filter(item => QUALITY_CONTROL_BAD_OPTIONS.includes(item))
    }
    if (score === QUALITY_CONTROL_VALUES_BY_KEY.GOOD) {
        return options.filter(item => QUALITY_CONTROL_GOOD_OPTIONS.includes(item))
    }
    return []
}

module.exports = {
    convertQualityControlOptionsToText,
    filterQualityControlOptionsByScore,
}
