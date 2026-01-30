const access = require('@open-condo/keystone/access')
/**
 * @typedef {Object} DirectAccessList
 * @property {string} schemaName
 * @property {boolean} readonly
 */

/**
 * @typedef {Object} DirectAccessField
 * @property {string} fieldName
 * @property {boolean} read
 * @property {boolean} manage
 */

/**
 * @typedef {Object} DirectAccessConfig
 * @property {Object.<string, Array.<DirectAccessField>>} fields
 * @property {Array.<DirectAccessList | string>} lists
 * @property {Array.<string>} services
 */

/**
 * Set of schemas available for direct access by specific users, similar to support / admin.
 *
 * Note that adding a schema to this config will automatically add the required fields to the UserRightsSet schema,
 * but accesses will not work automatically!
 * To do this, you need to explicitly add one of the utilities from "@condo/domains/user/utils/directAccess" to the model accesses.
 *
 * Also note that changing this config always generates a new migration!
 * @type {DirectAccessConfig}
 */
const DIRECT_ACCESS_AVAILABLE_SCHEMAS = {
    // Note: This list should be alphabetical when possible
    lists: [
        // Miniapps domain
        'B2BApp',
        'B2BAppAccessRight',
        'B2BAppAccessRightSet',
        'B2BAppContext',
        'B2BAppNewsSharingConfig',
        'B2BAppPermission',
        'B2BAppPromoBlock',
        'B2CApp',
        'B2CAppAccessRight',
        'B2CAppBuild',
        'B2CAppProperty',

        // Notification domain
        { schemaName: 'Message', readonly: true },
        'MessageBatch',

        // Organization domain
        'Organization',

        // Ticket domain
        'Ticket',
        'TicketAutoAssignment',

        // Property domain
        'Property',

        // User domain
        'OidcClient',
        'ResetUserLimitAction',
        { schemaName: 'User', readonly: true },
        'UserRightsSet',

        // Payments domain
        { schemaName: 'Payment', readonly: true },
        
        // Billing domain
        { schemaName: 'BillingReceipt', readonly: true },
        { schemaName: 'BillingIntegrationOrganizationContext', readonly: true },
    ],
    fields: {
        Organization: [
            { fieldName: 'isApproved', manage: true },
        ],
        BillingIntegrationOrganizationContext: [
            { fieldName: 'deletedAt', manage: true },
        ],
        Ticket: [
            { fieldName: 'sentToAuthoritiesAt', manage: true },
        ],
        User: [
            {
                fieldName: 'email',
                read: true,
                userRightsSetAccess: {
                    read: true,
                    create: access.userIsAdmin,
                    update: access.userIsAdmin,
                },
            },
            {
                fieldName: 'phone',
                read: true,
                userRightsSetAccess: {
                    read: true,
                    create: access.userIsAdmin,
                    update: access.userIsAdmin,
                },
            },
            {
                fieldName: 'hasMarketingConsent',
                manage: true,
            },
            {
                fieldName: 'rightsSet',
                manage: true,
                userRightsSetAccess: {
                    read: true,
                    create: access.userIsAdmin,
                    update: access.userIsAdmin,
                },
            },
        ],
    },
    services: [
        'registerNewServiceUser',
        'sendMessage',
        '_internalSendHashedResidentPhones',
        '_allPaymentsSum',
        '_allBillingReceiptsSum',
        'getAvailableSubscriptionPlans',
        'activateSubscriptionPlan',
    ],
}

module.exports = {
    DIRECT_ACCESS_AVAILABLE_SCHEMAS,
}
