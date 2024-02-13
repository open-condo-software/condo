const { AVAILABLE_TO_UPDATE_FIELDS } = require('./steps')

const ROLE_IS_NOT_SUPPORTED = 'ROLE_IS_NOT_SUPPORTED'
const UPDATE_FIELDS_ACCESS_DENIED = 'UPDATE_FIELDS_ACCESS_DENIED'
const UPDATE_COMPLETED_STEP_TYPE = 'UPDATE_COMPLETED_STEP_TYPE'

const ERRORS = {
    UPDATE_FIELDS_ACCESS_DENIED: {
        code: 'BAD_USER_INPUT',
        type: UPDATE_FIELDS_ACCESS_DENIED,
        message: `You can only update ${AVAILABLE_TO_UPDATE_FIELDS.map(field => `"${field}"`).join(', ')} fields`,
        messageForUser: 'api.tourStep.update.updateFieldsAccessDenied',
        messageInterpolation: {
            fields: AVAILABLE_TO_UPDATE_FIELDS.map(field => `"${field}"`).join(', '),
        },
    },
    UPDATE_COMPLETED_STEP_TYPE: {
        code: 'BAD_USER_INPUT',
        type: UPDATE_COMPLETED_STEP_TYPE,
        message: 'You can not update status of TourStep in "completed" status',
        messageForUser: 'api.tourStep.update.updateCompletedStepType',
    },
}

module.exports = {
    ROLE_IS_NOT_SUPPORTED,
    UPDATE_FIELDS_ACCESS_DENIED,
    UPDATE_COMPLETED_STEP_TYPE,
    ERRORS,
}