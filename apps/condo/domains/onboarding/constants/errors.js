const ROLE_IS_NOT_SUPPORTED = 'ROLE_IS_NOT_SUPPORTED'
const UPDATE_FIELDS_ACCESS_DENIED = 'UPDATE_FIELDS_ACCESS_DENIED'
const UPDATE_COMPLETED_STEP_TYPE = 'UPDATE_COMPLETED_STEP_TYPE'

const ERRORS = {
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