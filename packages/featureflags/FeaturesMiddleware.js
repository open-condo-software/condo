const express = require('express')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')

class FeaturesMiddleware {
    async prepareMiddleware () {
        const app = express()
        app.get('/api/features', async (req, res) => {
            const features = await featureToggleManager.fetchFeatures()
            res.status(200).json(features)
        })
        return app
    }
}

module.exports = {
    FeaturesMiddleware,
}
