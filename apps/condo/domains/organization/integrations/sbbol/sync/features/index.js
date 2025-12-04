const concat = require('lodash/concat')
const get = require('lodash/get')
const uniq = require('lodash/uniq')

const { getLogger } = require('@open-condo/keystone/logging')

const { SERVICE_PROVIDER_PROFILE_FEATURE, ACTIVE_BANKING_FEATURE, ALL_FEATURES } = require('@condo/domains/organization/constants/features')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const { syncServiceProviderProfileState } = require('./serviceProviderProfile')

const logger = getLogger('sbbol-sync-features')


/**
 * Updates organization with new features and creates all needed contexts if needed
 * @param context keystone context acquired from main sync task containing adminContext for server-side utils
 * @param organization created / updated organization
 * @param {Array<string>} features list of organization features
 * @returns {Promise<void>}
 */
async function syncFeatures ({ context, organization, features }) {
    const { context: adminContext } = context
    const orgId = organization.id
    // Get current feature-list
    const existingFeatures = get(organization, 'features', [])
    logger.info({
        msg: 'staring feature-sync process for organization',
        entityId: orgId,
        entity: 'Organization',
        data: {
            existingFeatures,
        },
    })
    // Remove out-dated features from existing feature list
    const actualExistingFeatures = existingFeatures.filter(feat => ALL_FEATURES.includes(feat))
    // Remove out-dated features from incoming feature list
    const actualFeaturesToConnect = features.filter(feat => ALL_FEATURES.includes(feat))
    const connectedFeatures = []

    // Feature-specific logic
    if (actualFeaturesToConnect.includes(SERVICE_PROVIDER_PROFILE_FEATURE)) {
        const success = await syncServiceProviderProfileState({ context, organization })
        if (success) {
            logger.info({
                msg: 'feature is successfully connected',
                entityId: orgId,
                entity: 'Organization',
                data: {
                    feature: SERVICE_PROVIDER_PROFILE_FEATURE,
                },
            })
            connectedFeatures.push(SERVICE_PROVIDER_PROFILE_FEATURE)
        }
    }

    if (!actualExistingFeatures.includes(ACTIVE_BANKING_FEATURE)) {
        logger.info({
            msg: 'feature is successfully connected',
            entityId: orgId,
            entity: 'Organization',
            data: {
                feature: ACTIVE_BANKING_FEATURE,
            },
        })
        connectedFeatures.push(ACTIVE_BANKING_FEATURE)
    }

    const actualFeatures = uniq(concat(actualExistingFeatures, connectedFeatures))

    // NOTE: syncOrganization uses registerNewOrganization under the hood.
    // We cannot open 'features' prop directly in this API method, so instead we're syncing all models here in single place
    // It's also moved after syncOrganization, since feature cannot be connected in 100% cases
    await Organization.update(adminContext, organization.id, {
        ...dvSenderFields,
        features: actualFeatures,
    })
}

module.exports = {
    syncFeatures,
}