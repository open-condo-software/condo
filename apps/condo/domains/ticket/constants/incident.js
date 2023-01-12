const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { WRONG_VALUE } = require('@condo/domains/common/constants/errors')


const INCIDENT_STATUS_ACTUAL = 'actual'
const INCIDENT_STATUS_NOT_ACTUAL = 'not_actual'
const INCIDENT_STATUSES = [
    INCIDENT_STATUS_ACTUAL,
    INCIDENT_STATUS_NOT_ACTUAL,
]

const INCIDENT_ERRORS = {
    WORK_FINISH_EARLY_THAN_WORK_START: {
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'The value of the "workFinish" field must be greater than the "workStart" field',
        messageForUser: 'api.incident.WORK_FINISH_EARLY_THAN_WORK_START',
    },
}

const INCIDENT_PROPERTY_ERRORS = {
    DIFFERENT_ORGANIZATIONS: {
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'Incident and property belong to different organizations',
    },
}

const INCIDENT_STATUS_COLORS = {
    [INCIDENT_STATUS_ACTUAL]: {
        text: '#ffffff',
        background: '#EB3468',
    },
    [INCIDENT_STATUS_NOT_ACTUAL]: {
        text: '#ffffff',
        background: '#39CE66',
    },
}

module.exports = {
    INCIDENT_STATUS_ACTUAL,
    INCIDENT_STATUS_NOT_ACTUAL,
    INCIDENT_STATUSES,
    INCIDENT_ERRORS,
    INCIDENT_PROPERTY_ERRORS,
    INCIDENT_STATUS_COLORS,
}
