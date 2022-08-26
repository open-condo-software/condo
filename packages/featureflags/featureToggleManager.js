const { GrowthBook } = require('@growthbook/growthbook')
const conf = require('@condo/config')

const FEATURE_TOGGLE_CONFIG = conf['FEATURE_TOGGLE_CONFIG']
let featureToggleApiUrl
let featureToggleApiKey

class FeatureToggleManager {
    constructor () {
        try {
            const config = JSON.parse(FEATURE_TOGGLE_CONFIG)
            featureToggleApiUrl = config.url
            featureToggleApiKey = config.apiKey

            this.growthbook = new GrowthBook()
            this.fetchFeatures()
        } catch (e) {
            console.error(e)
        }
    }

    async fetchFeatures () {
        if (featureToggleApiUrl && featureToggleApiKey) {
            await fetch(`${featureToggleApiUrl}/${featureToggleApiKey}`)
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