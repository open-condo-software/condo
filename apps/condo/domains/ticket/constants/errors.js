const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { WRONG_VALUE } = require('@condo/domains/common/constants/errors')


const UNKNOWN_GROUP_BY_FILTER = 'UNKNOWN_GROUP_BY_FILTER'

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

module.exports = {
    UNKNOWN_GROUP_BY_FILTER,
    INCIDENT_ERRORS,
    INCIDENT_PROPERTY_ERRORS,
}