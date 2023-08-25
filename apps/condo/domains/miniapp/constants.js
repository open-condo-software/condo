/**
 * List of app types available in CRM
 * type + id is used to get specific model from API
 * @type {(string)[]}
 */

// GLOBAL B2B APPS FEATURES
const GLOBAL_FEATURE_GRAPHQL_TYPE = 'B2BAppGlobalFeature'
const MAP_GENERATION_FEATURE = 'PropertyMapGeneration'
const ATTACH_CALL_RECORD_TO_TICKET_FEATURE = 'AttachCallRecordToTicket'
const SUPPORTED_GLOBAL_FEATURES = [
    MAP_GENERATION_FEATURE,
    ATTACH_CALL_RECORD_TO_TICKET_FEATURE,
]

const DISPATCHING_CATEGORY = 'DISPATCHING'
const GIS_CATEGORY = 'GIS'
const SMART_HOME_CATEGORY = 'SMART_HOME'
const BUSINESS_DEVELOPMENT_CATEGORY = 'BUSINESS_DEVELOPMENT'
const OTHER_CATEGORY = 'OTHER'

const B2B_APP_CATEGORIES = [
    DISPATCHING_CATEGORY,
    GIS_CATEGORY,
    SMART_HOME_CATEGORY,
    BUSINESS_DEVELOPMENT_CATEGORY,
    OTHER_CATEGORY,
]

const ALL_APPS_CATEGORY = 'RECOMMENDED'
const CONNECTED_APPS_CATEGORY = 'CONNECTED'

// There is special app with fixed ID that is used for debugging on mobile side
const DEBUG_APP_ID = 'kDomaLocalMiniappId'

const APP_FREE_LABEL = 'FREE'
const APP_DISCOUNT_LABEL = 'DISCOUNT'
const APP_POPULAR_LABEL = 'POPULAR'
const APP_NEW_LABEL = 'NEW'
const B2B_APPS_LABELS = [
    APP_FREE_LABEL,
    APP_DISCOUNT_LABEL,
    APP_POPULAR_LABEL,
    APP_NEW_LABEL,
]

const CONTEXT_IN_PROGRESS_STATUS = 'InProgress'
const CONTEXT_ERROR_STATUS = 'Error'
const CONTEXT_FINISHED_STATUS = 'Finished'

const CONTEXT_STATUSES = [
    CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_ERROR_STATUS,
    CONTEXT_FINISHED_STATUS,
]

const NON_SERVICE_USER_ERROR = '[user] No user specified or it has non-service type'
const NO_CONTEXT_STATUS_ERROR = '[status] Status field cannot be set to null'
const NON_ZIP_FILE_ERROR = 'NON_ZIP_FILE'
const RESTRICT_BUILD_SELECT_ERROR = '[currentBuild] Cannot set current build to build of other B2C app'
const INCORRECT_ADDRESS_ERROR = '[address] Incorrect address was provided. Make sure you use normalized address as input'
const INCORRECT_HOUSE_TYPE_ERROR = '[address] Address with specified house type is not currently supported'
const B2C_APP_COLOR_SCHEMA_TYPE_NAME = 'AppColorSchemaField'
const B2C_APP_COLOR_SCHEMA_INPUT_NAME = 'AppColorSchemaFieldInput'
const GLOBAL_APP_NO_APP_URL_ERROR = '[app:noAppUrl] If the app is global, it must have appUrl field'
const NON_GLOBAL_APP_WITH_FEATURES_ERROR = '[app:non-global:features] Non global apps cannot specify features'
const RESIDENT_NOT_FOUND_ERROR = 'RESIDENT_NOT_FOUND'
const PROPERTY_NOT_FOUND_ERROR = 'PROPERTY_NOT_FOUND'
const RESIDENT_OR_PROPERTY_ID_MISSING_ERROR = 'RESIDENT_OR_PROPERTY_ID_MISSING'
const USER_NOT_FOUND_ERROR = 'USER_NOT_FOUND'
const APP_NOT_FOUND_ERROR = 'APP_NOT_FOUND'
const APP_NOT_CONNECTED_ERROR = 'APP_NOT_CONNECTED'
const INVALID_PERMISSIONS_ERROR = 'INVALID_PERMISSIONS'
const APP_BLACK_LIST_ERROR = 'APP_BLACK_LIST_ERROR'
const PERMISSION_KEY_WRONG_FORMAT_ERROR = 'PERMISSION_KEY_WRONG_FORMAT'
const ACCESS_RIGHT_SET_NOT_FOR_CONNECTED_B2B_APP = 'ACCESS_RIGHT_SET_NOT_FOR_CONNECTED_B2B_APP'
const PERMISSION_NAME_INVALID_LENGTH_ERROR = 'PERMISSION_NAME_INVALID_LENGTH'

const MAX_PERMISSION_NAME_LENGTH = 50
const MIN_PERMISSION_NAME_LENGTH = 1

const PROMO_BLOCK_DARK_TEXT_VARIANT = 'BLACK'
const PROMO_BLOCK_LIGHT_TEXT_VARIANT = 'WHITE'
const PROMO_BLOCK_TEXT_VARIANTS = [
    PROMO_BLOCK_DARK_TEXT_VARIANT,
    PROMO_BLOCK_LIGHT_TEXT_VARIANT,
]
const PROMO_BLOCK_TEXT_VARIANTS_TO_PROPS = {
    [PROMO_BLOCK_DARK_TEXT_VARIANT]: {},
    [PROMO_BLOCK_LIGHT_TEXT_VARIANT]: { invertText: true },
}

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
 * // 2) You should to add "serviceUserAccessForB2BApp" plugin for MySchema schema
 * {
 *    schemaDoc: // ...some schemaDoc
 *    fields: // ...some fields
 *    hooks: // ...some hooks
 *    kmigratorOptions: // ...some kmigratorOptions
 *    access: // ...some access
 *    plugins: [
 *        // ...some your plugins
 *        serviceUserAccessForB2BApp()
 *    ]
 * }
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
 * @type {B2BAppAccessConfigBySchemaName}
 */
const SERVICE_USER_ACCESS_FOR_B2B_APP_CONFIG = {
    Contact: {},
    Organization: {
        pathToOrganizationId: ['id'],
        // NOTE: service users cannot manage organizations!
        canBeManage: false,
    },
    Property: {},
}

module.exports = {
    ALL_APPS_CATEGORY,
    CONNECTED_APPS_CATEGORY,
    DISPATCHING_CATEGORY,
    GIS_CATEGORY,
    SMART_HOME_CATEGORY,
    BUSINESS_DEVELOPMENT_CATEGORY,
    OTHER_CATEGORY,
    B2B_APP_CATEGORIES,
    CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_FINISHED_STATUS,
    CONTEXT_ERROR_STATUS,
    CONTEXT_STATUSES,
    NON_SERVICE_USER_ERROR,
    GLOBAL_APP_NO_APP_URL_ERROR,
    NO_CONTEXT_STATUS_ERROR,
    NON_ZIP_FILE_ERROR,
    RESTRICT_BUILD_SELECT_ERROR,
    INCORRECT_ADDRESS_ERROR,
    INCORRECT_HOUSE_TYPE_ERROR,
    B2C_APP_COLOR_SCHEMA_TYPE_NAME,
    B2C_APP_COLOR_SCHEMA_INPUT_NAME,
    GLOBAL_FEATURE_GRAPHQL_TYPE,
    MAP_GENERATION_FEATURE,
    ATTACH_CALL_RECORD_TO_TICKET_FEATURE,
    SUPPORTED_GLOBAL_FEATURES,
    NON_GLOBAL_APP_WITH_FEATURES_ERROR,
    PROMO_BLOCK_TEXT_VARIANTS,
    PROMO_BLOCK_DARK_TEXT_VARIANT,
    PROMO_BLOCK_TEXT_VARIANTS_TO_PROPS,
    APP_FREE_LABEL,
    APP_DISCOUNT_LABEL,
    APP_POPULAR_LABEL,
    APP_NEW_LABEL,
    B2B_APPS_LABELS,
    USER_NOT_FOUND_ERROR,
    RESIDENT_NOT_FOUND_ERROR,
    PROPERTY_NOT_FOUND_ERROR,
    RESIDENT_OR_PROPERTY_ID_MISSING_ERROR,
    APP_NOT_FOUND_ERROR,
    APP_NOT_CONNECTED_ERROR,
    INVALID_PERMISSIONS_ERROR,
    APP_BLACK_LIST_ERROR,
    PERMISSION_KEY_WRONG_FORMAT_ERROR,
    DEBUG_APP_ID,
    SERVICE_USER_ACCESS_FOR_B2B_APP_CONFIG,
    ACCESS_RIGHT_SET_NOT_FOR_CONNECTED_B2B_APP,
    PERMISSION_NAME_INVALID_LENGTH_ERROR,
    MAX_PERMISSION_NAME_LENGTH,
    MIN_PERMISSION_NAME_LENGTH,
}