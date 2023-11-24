const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { composeNonResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { plugin } = require('@open-condo/keystone/plugins/utils/typing')


const IMPORT_ID_FIELD_NAME = 'importId'
const IMPORT_REMOTE_SYSTEM_FIELD_NAME = 'importRemoteSystem'
const INVALID_IMPORT = 'INVALID_IMPORT'

function validateInput ({ resolvedData, context }) {
    if (
        (resolvedData[IMPORT_ID_FIELD_NAME] && !resolvedData[IMPORT_REMOTE_SYSTEM_FIELD_NAME]) ||
        (!resolvedData[IMPORT_ID_FIELD_NAME] && resolvedData[IMPORT_REMOTE_SYSTEM_FIELD_NAME])
    ) {
        throw new GQLError({
            code: BAD_USER_INPUT,
            type: INVALID_IMPORT,
            message: `Invalid attempt to import. Fields ${IMPORT_ID_FIELD_NAME} and ${IMPORT_REMOTE_SYSTEM_FIELD_NAME} must be set/cleared at the same time`,
        }, context)
    }
}

/**
 * Adds import-related fields to model and validates, that they're cleared / set at the same time
 * @param accessRestrictions access restrictions if you want to limit manage access up to a specific users (probably service ones)
 * @return {*}
 */
function importable ({ accessRestrictions } = {}) {
    return plugin(({ fields = {}, hooks = {}, ...rest }) => {
        fields[IMPORT_ID_FIELD_NAME] = {
            schemaDoc: 'ID of the object in the system from which it was imported',
            type: 'Text',
            isRequired: false,
            ...(accessRestrictions ? { access: accessRestrictions } : {}),
        }
        fields[IMPORT_REMOTE_SYSTEM_FIELD_NAME] = {
            schemaDoc: 'Name of the system from which object was imported',
            type: 'Text',
            isRequired: false,
            ...(accessRestrictions ? { access: accessRestrictions } : {}),
        }
        const originalValidateInput = hooks.validateInput
        hooks.validateInput = composeNonResolveInputHook(originalValidateInput, validateInput)
        return { fields, hooks, ...rest }
    })
}

module.exports = {
    importable,
}