const { get } = require('lodash')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')

const { FEEDBACK_VALUES_BY_KEY, FEEDBACK_BAD_OPTIONS, FEEDBACK_GOOD_OPTIONS } = require('@condo/domains/ticket/constants/feedback')
const {
    QUALITY_CONTROL_VALUES_BY_KEY,
    QUALITY_CONTROL_BAD_OPTIONS,
    QUALITY_CONTROL_GOOD_OPTIONS,
} = require('@condo/domains/ticket/constants/qualityControl')


const convertQualityControlOrFeedbackOptionsToText = (options, optionsMessages) => {
    if (!isArray(options) || isEmpty(options) || isEmpty(optionsMessages)) return null
    const selectedOptions = options.map((key) => optionsMessages[key]).filter(Boolean)
    if (selectedOptions.length < 1) return null
    return selectedOptions.join(', ')
}

const filterQualityControlOrFeedbackOptionsByScore = (score, options, badOptions, goodOptions, badScoreKey, goodScoreKey) => {
    if (!isArray(options) || isEmpty(options)) return []
    if (score === badScoreKey) {
        return options.filter(item => badOptions.includes(item))
    }
    if (score === goodScoreKey) {
        return options.filter(item => goodOptions.includes(item))
    }
    return []
}

const filterFeedbackOptionsByScore = (score, options) => {
    return filterQualityControlOrFeedbackOptionsByScore(
        score, options,
        FEEDBACK_BAD_OPTIONS, FEEDBACK_GOOD_OPTIONS,
        FEEDBACK_VALUES_BY_KEY.BAD, FEEDBACK_VALUES_BY_KEY.GOOD
    )
}

const filterQualityControlOptionsByScore = (score, options) => {
    return filterQualityControlOrFeedbackOptionsByScore(
        score, options,
        QUALITY_CONTROL_BAD_OPTIONS, QUALITY_CONTROL_GOOD_OPTIONS,
        QUALITY_CONTROL_VALUES_BY_KEY.BAD, QUALITY_CONTROL_VALUES_BY_KEY.GOOD
    )
}

const buildFullClassifierName = (classifier) => {
    return [
        get(classifier, 'place.name', '').trim(),
        get(classifier, 'category.name', '').trim(),
        get(classifier, 'problem.name', '').trim(),
    ].filter(Boolean).join(' » ')
}

module.exports = {
    convertQualityControlOrFeedbackOptionsToText,
    filterFeedbackOptionsByScore,
    filterQualityControlOptionsByScore,
    buildFullClassifierName,
}
