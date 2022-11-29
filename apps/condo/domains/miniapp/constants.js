const BILLING_APP_TYPE = 'BILLING'
const ACQUIRING_APP_TYPE = 'ACQUIRING'
const B2B_APP_TYPE = 'B2B'

/**
 * List of app types available in CRM
 * type + id is used to get specific model from API
 * @type {(string)[]}
 */
const APP_TYPES = [
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
    B2B_APP_TYPE,
]

// GLOBAL B2B APPS FEATURES
const GLOBAL_FEATURE_GRAPHQL_TYPE = 'B2BAppGlobalFeature'
const MAP_GENERATION_FEATURE = 'PropertyMapGeneration'
const SUPPORTED_GLOBAL_FEATURES = [
    MAP_GENERATION_FEATURE,
]

const OTHER_CATEGORY = 'OTHER'

const B2B_APP_CATEGORIES = [
    OTHER_CATEGORY,
]

const CONTEXT_IN_PROGRESS_STATUS = 'InProgress'
const CONTEXT_ERROR_STATUS = 'Error'
const CONTEXT_FINISHED_STATUS = 'Finished'

const CONTEXT_STATUSES = [
    CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_ERROR_STATUS,
    CONTEXT_FINISHED_STATUS,
]

const NO_INSTRUCTION_OR_MESSAGE_ERROR = '[integration:noInstructionOrMessage] If integration does not have appUrl, it must have instruction and connected message fields'
const NON_SERVICE_USER_ERROR = '[user] No user specified or it has non-service type'
const NO_CONTEXT_STATUS_ERROR = '[status] Status field cannot be set to null'
const NON_ZIP_FILE_ERROR = '[data] Expected data to have "application/zip" mimetype'
const RESTRICT_BUILD_SELECT_ERROR = '[currentBuild] Cannot set current build to build of other B2C app'
const INCORRECT_ADDRESS_ERROR = '[address] Incorrect address was provided. Make sure you use normalized address as input'
const INCORRECT_HOUSE_TYPE_ERROR = '[address] Address with specified house type is not currently supported'
const B2C_APP_COLOR_SCHEMA_TYPE_NAME = 'AppColorSchemaField'
const B2C_APP_COLOR_SCHEMA_INPUT_NAME = 'AppColorSchemaFieldInput'
const LOCAL_APP_NO_INSTRUCTION_OR_MESSAGE_ERROR = '[app:noInstructionOrMessage] If the app is not global, then it must have either the appUrl field or the instruction and connectedMessage fields'
const GLOBAL_APP_NO_APP_URL_ERROR = '[app:noAppUrl] If the app is global, it must have appUrl field'
const NON_GLOBAL_APP_WITH_FEATURES_ERROR = '[app:non-global:features] Non global apps cannot specify features'

const PROMO_BLOCK_TEXTS_VARIANTS_TO_PROPS = {
    BLACK: {},
    WHITE: { invertText: true },
}

module.exports = {
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
    B2B_APP_TYPE,
    APP_TYPES,
    OTHER_CATEGORY,
    B2B_APP_CATEGORIES,
    CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_FINISHED_STATUS,
    CONTEXT_ERROR_STATUS,
    CONTEXT_STATUSES,
    NON_SERVICE_USER_ERROR,
    NO_INSTRUCTION_OR_MESSAGE_ERROR,
    LOCAL_APP_NO_INSTRUCTION_OR_MESSAGE_ERROR,
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
    SUPPORTED_GLOBAL_FEATURES,
    NON_GLOBAL_APP_WITH_FEATURES_ERROR,
    PROMO_BLOCK_TEXTS_VARIANTS_TO_PROPS,
}