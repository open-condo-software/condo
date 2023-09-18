/**
 * Set of schemas available for direct access by specific users, similar to support / admin.
 *
 * Note that adding a schema to this config will automatically add the required fields to the UserRightsSet schema,
 * but accesses will not work automatically!
 * To do this, you need to explicitly add one of the utilities from "@condo/domains/user/utils/directAccess" to the model accesses.
 *
 * Also note that changing this config always generates a new migration!
 * @typedef {{schemaName: string, readonly?: boolean}} DirectAccessList
 * @typedef {{lists: Array<DirectAccessList | string>, services: Array<string>}} DirectAccessConfig
 * @type {DirectAccessConfig}
 */
const DIRECT_ACCESS_AVAILABLE_SCHEMAS = {
    lists: [
        // Miniapps domain
        'B2BApp',
        'B2BAppAccessRight',
        'B2BAppAccessRightSet',
        'B2BAppContext',
        'B2BAppPermission',
        'B2BAppPromoBlock',
        'B2CApp',
        'B2CAppAccessRight',
        'B2CAppBuild',
        'B2CAppProperty',

        // Organization domain
        { schemaName: 'Organization', readonly: true },

        // Ticket domain
        'Ticket',
    ],
    services: [
        'registerNewServiceUser',
        'sendMessage',
    ],
}

module.exports = {
    DIRECT_ACCESS_AVAILABLE_SCHEMAS,
}