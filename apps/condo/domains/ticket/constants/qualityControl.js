const QUALITY_CONTROL_VALUES_BY_KEY = {
    BAD: 'bad',
    GOOD: 'good',
}

const QUALITY_CONTROL_VALUES = Object.values(QUALITY_CONTROL_VALUES_BY_KEY)

const QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY = {
    LOW_QUALITY: 'lowQuality',
    HIGH_QUALITY: 'highQuality',
    SLOWLY: 'slowly',
    QUICKLY: 'quickly',
}

const QUALITY_CONTROL_ADDITIONAL_OPTIONS = Object.values(QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY)

const QUALITY_CONTROL_BAD_OPTIONS = [
    QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY.LOW_QUALITY,
    QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY.SLOWLY,
]

const QUALITY_CONTROL_GOOD_OPTIONS = [
    QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY.HIGH_QUALITY,
    QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY.QUICKLY,
]

module.exports = {
    QUALITY_CONTROL_VALUES_BY_KEY,
    QUALITY_CONTROL_VALUES,
    QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY,
    QUALITY_CONTROL_ADDITIONAL_OPTIONS,
    QUALITY_CONTROL_BAD_OPTIONS,
    QUALITY_CONTROL_GOOD_OPTIONS,
}
