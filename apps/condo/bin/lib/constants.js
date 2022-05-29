const path = require('path')

const EXEC_COMMAND = 'yarn workspace @app/condo node'
const BASE_NAME = path.posix.basename(process.argv[1])
const MAX_SEND_COUNT = 100
const FORCE_SEND = 'FORCE_SEND'
const DATE_FORMAT = 'YYYY-MM-DD'
const CHUNK_SIZE = 50
const MAX_ROWS_COUNT = 1000000

module.exports = {
    EXEC_COMMAND,
    BASE_NAME,
    MAX_SEND_COUNT,
    FORCE_SEND,
    DATE_FORMAT,
    CHUNK_SIZE,
    MAX_ROWS_COUNT,
}