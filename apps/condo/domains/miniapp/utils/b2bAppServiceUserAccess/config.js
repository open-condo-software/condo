/**
 * In this configuration, you should specify all schemas for which you want to propagate service user access for b2b apps
 * ------
 * ________
 * @example How to add a new schema? (For example MySchema schema)
 *
 * // 1) You should add config for MySchema schema
 * {
 *    // in the "B2BAppAccessRightSet" schema, the "canReadMySchemas" and "canManageMySchemas" fields will be added.
 *    MySchema: {
 *       // Below are the default values
 *       // If nothing is specified, they will apply:
 *       // pathToOrganizationId: ['organization', 'id'],
 *       // canBeManage: true,
 *       // canBeRead: true,
 *
 *       // You can override values as needed
 *    },
 * }
 *
 * // 2) you need to explicitly add one of the utilities from "@condo/domains/miniapp/utils/b2bAppServiceUserAccess" to the model accesses
 *
 * // 3) You should update 'schema.ts' and 'schema.graphql'
 * // run 'yarn maketypes'
 *
 * // 4) You should make new migrations
 * // run 'yarn makemigrations'
 *
 * // 5) You should apply new migrations
 * // run 'yarn migrate'
 *
 *
 * @type {B2bAppServiceUserAccessConfig}
 */
const B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS = {
    Contact: {},
    Organization: {
        pathToOrganizationId: ['id'],
        // NOTE: service users cannot manage organizations!
        canBeManage: false,
    },
    Meter: {},
    MeterReading: {},
    Property: {},
}

module.exports = {
    B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS,
}
