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
        } catch (e) {
            console.error(e)
        }
    }

    async fetchFeatures () {
        if (featureToggleApiUrl && featureToggleApiKey) {
            return await fetch(`${featureToggleApiUrl}/${featureToggleApiKey}`)
                .then((res) => res.json())
                .then((parsed) => {
                    return Promise.resolve(parsed.features)
                })
                .catch(e => console.error(e))
        }
    }

    isFeatureEnabled (request, featureName, context) {
        if (conf.NODE_ENV === 'test' && request && request.headers) {
            return request.headers['feature-flags'] === 'true'
        }

        const growthbook = new GrowthBook()

        growthbook.setFeatures(request.features)
        if (context) {
            growthbook.setAttributes(context)
        }

        return growthbook.isOn(featureName)
    }
}

const featureToggleManager = new FeatureToggleManager()

module.exports = {
    featureToggleManager,
}