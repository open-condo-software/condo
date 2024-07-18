const { DOCX } = require('@condo/domains/common/constants/export')
const { RU_LOCALE, EN_LOCALE } = require('@condo/domains/common/constants/locale')


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

const SUPPORTED_DOCUMENT_TYPES_BY_LOCALE = {
    [RU_LOCALE]: [TICKET_DOCUMENT_TYPE.COMPLETION_WORKS],
    [EN_LOCALE]: [],
}

module.exports = {
    TICKET_DOCUMENT_GENERATION_TASK_STATUS,
    TICKET_DOCUMENT_TYPE,
    TICKET_DOCUMENT_GENERATION_TASK_FORMAT,
    INVALID_OPTIONS_ERROR,
    SUPPORTED_DOCUMENT_TYPES_BY_LOCALE,
}
