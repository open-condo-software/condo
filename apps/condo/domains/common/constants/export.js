const PROCESSING = 'processing'
const COMPLETED = 'completed'
const ERROR = 'error'
const CANCELLED = 'cancelled'

const EXPORT_STATUS_VALUES = [PROCESSING, COMPLETED, ERROR, CANCELLED]

const EXCEL = 'excel'
const PDF = 'pdf'

const EXPORT_FORMAT_VALUES = [EXCEL, PDF]

const EXPORT_PROCESSING_BATCH_SIZE = 100

module.exports = {
    PROCESSING,
    COMPLETED,
    ERROR,
    CANCELLED,
    EXCEL,
    PDF,
    EXPORT_STATUS_VALUES,
    EXPORT_FORMAT_VALUES,
    EXPORT_PROCESSING_BATCH_SIZE,
}
