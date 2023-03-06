const concat = require('lodash/concat')
const get = require('lodash/get')
const uniq = require('lodash/uniq')

const { SERVICE_PROVIDER_PROFILE_FEATURE, ALL_FEATURES } = require('@condo/domains/organization/constants/features')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const { syncServiceProviderProfileState } = require('./serviceProviderProfile')


/**
 * Updates organization with new features and creates all needed contexts if needed
 * @param context keystone context acquired from main sync task containing adminContext for server-side utils
 * @param organization created / updated organization
 * @param {Array<string>} features list of organization features
 * @returns {Promise<void>}
 */
async function syncFeatures ({ context, organization, features }) {
    const { context: adminContext } = context
    // Get current feature-list
    const existingFeatures = get(organization, 'features', [])
    // Merge with new features
    const mergedFeatures = uniq(concat(existingFeatures, features))
    // Filter outdated features
    const actualFeatures = mergedFeatures.filter(feat => ALL_FEATURES.includes(feat))

    // NOTE: syncOrganization uses registerNewOrganization under the hood.
    // We cannot open 'features' prop directly in this API, so instead we're syncing all models here in single place
    await Organization.update(adminContext, organization.id, {
        ...dvSenderFields,
        features: actualFeatures,
    })

    // Feature-specific logic
    if (features.includes(SERVICE_PROVIDER_PROFILE_FEATURE)) {
        await syncServiceProviderProfileState({ context, organization })
    }
}

module.exports = {
    syncFeatures,
}