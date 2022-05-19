const path = require('path')

const EXEC_COMMAND = 'yarn workspace @app/condo node'
const BASE_NAME = path.posix.basename(process.argv[1])
const MAX_SEND_COUNT = 100
const FORCE_SEND = 'FORCE_SEND'
const DATE_FORMAT = 'YYYY-MM-DD'

module.exports = {
    EXEC_COMMAND,
    BASE_NAME,
    MAX_SEND_COUNT,
    FORCE_SEND,
    DATE_FORMAT,
}