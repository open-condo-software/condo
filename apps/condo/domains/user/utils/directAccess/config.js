/**
 * @typedef {Object} DirectAccessList
 * @property {string} schemaName
 * @property {boolean} readonly
 */

/**
 * @typedef {Object} DirectAccessConfig
 * @property {Object.<string, Array.<string>>} fields
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

        // Organization domain
        'Organization',

        // Ticket domain
        'Ticket',

        // User domain
        'OidcClient',
        { schemaName: 'User', readonly: true },
        'UserRightsSet',
    ],
    fields: {
        Organization: ['isApproved'],
    },
    services: [
        'registerNewServiceUser',
        'sendMessage',
    ],
}

module.exports = {
    DIRECT_ACCESS_AVAILABLE_SCHEMAS,
}
