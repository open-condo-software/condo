const ROLE_IS_NOT_SUPPORTED = 'ROLE_IS_NOT_SUPPORTED'
const UPDATE_FIELDS_ACCESS_DENIED = 'UPDATE_FIELDS_ACCESS_DENIED'
const UPDATE_COMPLETED_STEP_TYPE = 'UPDATE_COMPLETED_STEP_TYPE'
const TOUR_STEPS_NOT_FOUND_TYPE = 'TOUR_STEPS_NOT_FOUND'

const ERRORS = {
    UPDATE_COMPLETED_STEP_TYPE: {
        code: 'BAD_USER_INPUT',
        type: UPDATE_COMPLETED_STEP_TYPE,
        message: 'You can not update status of TourStep in "completed" status',
        messageForUser: 'api.tourStep.update.updateCompletedStepType',
    },
}

const SYNC_TOUR_STEPS_ERRORS = {
    TOUR_STEPS_NOT_FOUND: {
        mutation: 'syncTourSteps',
        code: 'BAD_USER_INPUT',
        type: TOUR_STEPS_NOT_FOUND_TYPE,
        message: 'Tour steps not found for this organization',
        messageForUser: 'api.onboarding.syncTourSteps.TOUR_STEPS_NOT_FOUND',
    },
}

module.exports = {
    ROLE_IS_NOT_SUPPORTED,
    UPDATE_FIELDS_ACCESS_DENIED,
    UPDATE_COMPLETED_STEP_TYPE,
    ERRORS,
    SYNC_TOUR_STEPS_ERRORS,
}