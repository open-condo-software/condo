const { GrowthBook } = require('@growthbook/growthbook')
const conf = require('@condo/config')

const FEATURE_TOGGLE_CONFIG = conf['FEATURE_TOGGLE_CONFIG']
const FEATURE_TOGGLE_API_URL = FEATURE_TOGGLE_CONFIG && FEATURE_TOGGLE_CONFIG.url
const FEATURE_TOGGLE_API_KEY = FEATURE_TOGGLE_CONFIG && FEATURE_TOGGLE_CONFIG.apiKey

class FeatureToggleManager {
    constructor () {
        this.growthbook = new GrowthBook()
        this.fetchFeatures()
    }

    async fetchFeatures () {
        if (FEATURE_TOGGLE_API_URL && FEATURE_TOGGLE_API_KEY) {
            await fetch(`${FEATURE_TOGGLE_API_URL}/${FEATURE_TOGGLE_API_KEY}`)
                .then((res) => res.json())
                .then((parsed) => {
                    this.growthbook.setFeatures(parsed.features)
                })
        }
    }

    async isFeatureEnabled (featureName, context) {
        await this.fetchFeatures()

        if (context) {
            this.growthbook.setAttributes(context)
        }

        return this.growthbook.isOn(featureName)
    }
}

const featureToggleManager = new FeatureToggleManager()

module.exports = {
    featureToggleManager,
}