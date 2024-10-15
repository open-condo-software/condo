const PROCESSING = 'processing'
const COMPLETED = 'completed'
const ERROR = 'error'
const CANCELLED = 'cancelled'

const IMPORT_STATUS_VALUES = [PROCESSING, COMPLETED, ERROR, CANCELLED]

const DOMA_EXCEL = 'excel_doma'
const CSV = 'csv_1s'
const IMPORT_FORMAT_VALUES = [DOMA_EXCEL, CSV]

const DEFAULT_RECORDS_LIMIT_FOR_IMPORT = 500
const EXTENDED_RECORDS_LIMIT_FOR_IMPORT = 10000

const METER_READINGS_IMPORT_TASK_FOLDER_NAME = 'MeterReadingsImportTask'

const DATE_SYMBOLS_ORDER_VARIANTS = [
    ['YYYY', 'MM', 'DD'],
    ['DD', 'MM', 'YYYY'],
    ['MM', 'YYYY'],
    ['YYYY', 'MM'],
]
const DATE_SYMBOLS_DELIMITERS = ['/', '.', '-']
const TIME_VARIANTS = [
    'HH:mm:ss',
    'HH:mm',
]

const DATE_FORMATS = DATE_SYMBOLS_ORDER_VARIANTS
    .flatMap((order) =>
        DATE_SYMBOLS_DELIMITERS.map(delimiter => order.join(delimiter))
    )
const DATE_TIME_FORMATS = DATE_FORMATS
    .flatMap((dateFormat) =>
        TIME_VARIANTS.map(timeVariant => [dateFormat, timeVariant].join(' '))
    )

const DEFAULT_DATE_PARSING_FORMATS = [
    ...DATE_TIME_FORMATS,
    ...DATE_FORMATS,

    'YYYY-MM-DDTHH:mm:ss.SSS[Z]', // The result of dayjs().toISOString()
    'YYYY-MM-DDTHH:mm:ss.SSSZ',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ssZZ',
    'YYYY-MM-DDTHH:mm:ssZ',
    'YYYY-MM-DDTHH:mm:ss',
].sort((a, b) => b.length - a.length) // Order matters! see "Differences to moment" https://day.js.org/docs/en/parse/string-format
const ISO_DATE_FORMAT = 'YYYY-MM-DD'
const EUROPEAN_DATE_FORMAT = 'DD.MM.YYYY'


module.exports = {
    DEFAULT_RECORDS_LIMIT_FOR_IMPORT,
    EXTENDED_RECORDS_LIMIT_FOR_IMPORT,

    PROCESSING, COMPLETED, ERROR, CANCELLED,
    IMPORT_STATUS_VALUES,

    DOMA_EXCEL, CSV,
    IMPORT_FORMAT_VALUES,

    METER_READINGS_IMPORT_TASK_FOLDER_NAME,

    DEFAULT_DATE_PARSING_FORMATS,
    ISO_DATE_FORMAT,
    EUROPEAN_DATE_FORMAT,
}