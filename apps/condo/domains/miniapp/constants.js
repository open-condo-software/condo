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
const NO_APP_ERROR = '[app] Cannot create B2C app build without linking it to app'
const RESTRICT_APP_CHANGE_ERROR = '[app] The "app" field of relative can only be updated to null to trigger a soft-delete operation. If you want to relink build to another app, you must create a separate build for it'
const RESTRICT_BUILD_SELECT_ERROR = '[currentBuild] Cannot set current build to build of other B2C app'

const B2C_APP_COLOR_SCHEMA_TYPE_NAME = 'AppColorSchemaField'
const B2C_APP_COLOR_SCHEMA_INPUT_NAME = 'AppColorSchemaFieldInput'


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
    NO_CONTEXT_STATUS_ERROR,
    NO_APP_ERROR,
    NON_ZIP_FILE_ERROR,
    RESTRICT_APP_CHANGE_ERROR,
    RESTRICT_BUILD_SELECT_ERROR,
    B2C_APP_COLOR_SCHEMA_TYPE_NAME,
    B2C_APP_COLOR_SCHEMA_INPUT_NAME,
}