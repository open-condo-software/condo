const { GrowthBook } = require('@growthbook/growthbook')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')

const logger = getLogger('featureToggleManager')

const FEATURE_TOGGLE_CONFIG = (conf.FEATURE_TOGGLE_CONFIG) ? JSON.parse(conf.FEATURE_TOGGLE_CONFIG) : {}

const REDIS_FEATURES_KEY = 'features'
const FEATURES_EXPIRED_IN_SECONDS = 60

class FeatureToggleManager {
    get redis () {
        if (!this._redis) this._redis = getRedisClient('features')
        return this._redis
    }

    constructor () {
        if (FEATURE_TOGGLE_CONFIG.url && FEATURE_TOGGLE_CONFIG.apiKey) {
            this._url = `${FEATURE_TOGGLE_CONFIG.url}/${FEATURE_TOGGLE_CONFIG.apiKey}`
            this._static = null
        } else if (FEATURE_TOGGLE_CONFIG.static) {
            // NOTE(pahaz): value example: {"sms-after-ticket-creation":{"defaultValue":false,"rules":[{"condition":{"organization":{"$in":[]}},"force":true}]},"refetch-tickets-in-control-room":{"defaultValue":false,"rules":[{"force":true}]},"ticket-import":{"defaultValue":false,"rules":[{"condition":{"isSupport":true},"force":true}]},"send-billing-receipts-notifications-task":{"defaultValue":true},"max-count-completed-ticket-to-close-for-organization-task":{"defaultValue":100}}
            this._url = null
            this._static = FEATURE_TOGGLE_CONFIG.static
        } else {
            this._url = null
            this._static = {}
            logger.warn('No FEATURE_TOGGLE_CONFIG! Every features and values will be false!')
        }
        this._redisKey = REDIS_FEATURES_KEY
        this._redisExpires = FEATURES_EXPIRED_IN_SECONDS
    }

    async fetchFeatures () {
        if (this._url) {
            try {
                const cachedFeatureFlags = await this.redis.get(this._redisKey)
                if (cachedFeatureFlags) return JSON.parse(cachedFeatureFlags)

                const fetchedFeatureFlags = await fetch(this._url)
                    .then((res) => res.json())
                    .then((parsed) => {
                        return Promise.resolve(parsed.features)
                    })

                await this.redis.set(this._redisKey, JSON.stringify(fetchedFeatureFlags), 'EX', this._redisExpires)
                return fetchedFeatureFlags
            } catch (err) {
                logger.error({ msg: 'fetchFeatures error', err })
            }
        } else if (this._static) {
            return JSON.parse(JSON.stringify(this._static))
        }

        throw new Error('FeatureToggleManager config error!')
    }

    async _getFeaturesFromKeystoneContext (keystoneContext) {
        const req = get(keystoneContext, 'req')
        let features = get(req, 'features')

        // Note: fetch features if needed! And save it in `req` if in request context
        if (!features) {
            features = await this.fetchFeatures()
            if (req) req.features = features
        }

        return features
    }

    async _getGrowthBookInstance (keystoneContext, featuresContext) {
        const features = await this._getFeaturesFromKeystoneContext(keystoneContext)
        const growthbook = new GrowthBook()
        growthbook.setFeatures(features)
        if (featuresContext) growthbook.setAttributes(featuresContext)
        return growthbook
    }

    async isFeatureEnabled (keystoneContext, featureName, featuresContext) {
        // Note: if you want to override the flag value by tests you cen set the `feature-flags` header! (TESTS ONLY)
        if (conf.NODE_ENV === 'test') {
            const headersFeatureFlags = get(keystoneContext, ['req', 'headers', 'feature-flags'])
            return headersFeatureFlags === 'true'
        }

        const growthbook = await this._getGrowthBookInstance(keystoneContext, featuresContext)
        return growthbook.isOn(featureName)
    }

    async getFeatureValue (keystoneContext, featureName, defaultValue, featuresContext) {
        // Note: if you want to override the flag value by tests you cen set the `feature-value` header! (TESTS ONLY)
        if (conf.NODE_ENV === 'test') {
            const headersFeatureValue = get(keystoneContext, ['req', 'headers', 'feature-value'])
            if (headersFeatureValue) {
                return JSON.parse(headersFeatureValue)
            }
            return defaultValue
        }

        const growthbook = await this._getGrowthBookInstance(keystoneContext, featuresContext)
        return growthbook.getFeatureValue(featureName, defaultValue)
    }
}

const featureToggleManager = new FeatureToggleManager()

module.exports = {
    featureToggleManager,
}
