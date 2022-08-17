const unleash = require('unleash-client')
const conf = require('@condo/config')

class FeatureFlagsManager {
    constructor () {
        unleash.initialize({
            url: conf.UNLEASH_API_URL,
            appName: 'condo',
            environment: conf.NODE_ENV,
            customHeaders: { Authorization: conf.UNLEASH_API_TOKEN },
        })
    }

    isEnabled (name, context) {
        return unleash.isEnabled(name, context)
    }
}

const featureFlagsManager = new FeatureFlagsManager()

module.exports = {
    featureFlagsManager,
}