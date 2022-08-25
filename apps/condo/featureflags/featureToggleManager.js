const { GrowthBook } = require('@growthbook/growthbook')
const conf = require('@condo/config')
const get = require('lodash/get')

const FEATURE_TOGGLE_CONFIG = conf['FEATURE_TOGGLE_CONFIG']

class FeatureToggleManager {
    constructor () {
        this.growthbook = new GrowthBook()
        this.fetchFeatures()
    }

    async fetchFeatures () {
        await fetch(`${get(FEATURE_TOGGLE_CONFIG, 'url')}/${get(FEATURE_TOGGLE_CONFIG, 'apiKey')}`)
            .then((res) => res.json())
            .then((parsed) => {
                this.growthbook.setFeatures(parsed.features)
            })
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