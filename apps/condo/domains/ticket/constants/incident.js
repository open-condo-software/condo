const INCIDENT_STATUS_ACTUAL = 'actual'
const INCIDENT_STATUS_NOT_ACTUAL = 'not_actual'
const INCIDENT_STATUSES = [
    INCIDENT_STATUS_ACTUAL,
    INCIDENT_STATUS_NOT_ACTUAL,
]

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
    INCIDENT_STATUS_COLORS,
}
