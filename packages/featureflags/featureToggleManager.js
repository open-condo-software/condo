const { GrowthBook } = require('@growthbook/growthbook')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { getFeatureFlag } = require('@open-condo/keystone/test.utils')

const logger = getLogger('feature-toggle-manager')

const FEATURE_TOGGLE_CONFIG = (conf.FEATURE_TOGGLE_CONFIG) ? JSON.parse(conf.FEATURE_TOGGLE_CONFIG) : {}

const REDIS_FEATURES_KEY = 'features'
const REDIS_UPDATE_FEATURES_KEY = 'features-update'
const FEATURES_EXPIRED_IN_SECONDS = 60

class FeatureToggleManager {
    get redis () {
        if (!this._redis) this._redis = getKVClient('features')
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
        this._redisUpdateKey = REDIS_UPDATE_FEATURES_KEY
        this._redisExpires = FEATURES_EXPIRED_IN_SECONDS
    }

    async fetchFeatures () {
        try {
            if (this._url) {
                const wasUpdatedRecently = await this.redis.get(this._redisUpdateKey)
                if (wasUpdatedRecently) {
                    return this._getFeaturesFromCache()
                }
                const result = await fetch(this._url)
                const parsedResult = await result.json()
                const features = parsedResult.features
                await this.redis.set(this._redisKey, JSON.stringify(features))
                await this.redis.set(this._redisUpdateKey, 'true', 'EX', this._redisExpires)
                return features

            } else if (this._static) {
                return JSON.parse(JSON.stringify(this._static))
            }

            throw new Error('FeatureToggleManager config error!')
        } catch (err) {
            logger.error({ msg: 'fetchFeatures error', err })
            if (this._url) {
                return this._getFeaturesFromCache()
            }
            return {}
        }
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
        // Note: if you want to override the flag value by tests you can use setFeatureFlag() from test.utils! (TESTS ONLY)
        if (conf.USE_LOCAL_FEATURE_FLAGS) {
            return getFeatureFlag(keystoneContext, featureName)
        }

        const growthbook = await this._getGrowthBookInstance(keystoneContext, featuresContext)
        return growthbook.isOn(featureName)
    }

    async getFeatureValue (keystoneContext, featureName, defaultValue, featuresContext) {
        // Note: if you want to override the flag value by tests you use setFeatureFlag() from test.utils! (TESTS ONLY)
        if (conf.USE_LOCAL_FEATURE_FLAGS) {
            return getFeatureFlag(keystoneContext, featureName) || defaultValue
        }

        const growthbook = await this._getGrowthBookInstance(keystoneContext, featuresContext)
        return growthbook.getFeatureValue(featureName, defaultValue)
    }

    async _getFeaturesFromCache () {
        const cachedFeatureFlags = await this.redis.get(this._redisKey)
        if (cachedFeatureFlags) {
            try {
                return JSON.parse(cachedFeatureFlags)
            } catch (err) {
                logger.error({ msg: '_getFeaturesFromCache json.parse error', err })
                return {}
            }
        }
        return {}
    }
}

const featureToggleManager = new FeatureToggleManager()

module.exports = {
    featureToggleManager,
}
