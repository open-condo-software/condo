const { DOCX } = require('@condo/domains/common/constants/export')
const { RU_LOCALE } = require('@condo/domains/common/constants/locale')


const TICKET_DOCUMENT_GENERATION_TASK_STATUS = {
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
    CANCELLED: 'cancelled',
}

const TICKET_DOCUMENT_TYPE = {
    COMPLETION_WORKS: 'completionWorks',
}

const TICKET_DOCUMENT_GENERATION_TASK_FORMAT = {
    DOCX: DOCX,
}

const INVALID_OPTIONS_ERROR = 'INVALID_OPTIONS_ERROR'

const AVAILABILITY_TICKET_DOCUMENT = {
    [TICKET_DOCUMENT_TYPE.COMPLETION_WORKS]: {
        supportedLocales: [RU_LOCALE],
    },
}

module.exports = {
    TICKET_DOCUMENT_GENERATION_TASK_STATUS,
    TICKET_DOCUMENT_TYPE,
    TICKET_DOCUMENT_GENERATION_TASK_FORMAT,
    INVALID_OPTIONS_ERROR,
    AVAILABILITY_TICKET_DOCUMENT,
}
