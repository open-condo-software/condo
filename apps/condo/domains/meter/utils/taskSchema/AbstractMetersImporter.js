const { chunk, get, isArray } = require('lodash')
const XLSX = require('xlsx')

const { getLogger } = require('@open-condo/keystone/logging')
const { i18n } = require('@open-condo/locales/loader')

const READINGS_CHUNK_SIZE = 100
const logger = getLogger('AbstractMetersImporter')

class AbstractMetersImporter {
    constructor (
        columnsHeaders,
        mappers,
        importRows,
        errors,
        mutationErrorsToMessages,
        breakProcessChecker,
        setTotalRows,
        setProcessedRows,
        setImportedRows,
        errorHandler,
    ) {
        this.columnsHeaders = columnsHeaders
        this.mappers = mappers
        this.importRows = importRows
        this.errors = errors
        this.mutationErrorsToMessages = mutationErrorsToMessages
        this.breakProcessChecker = breakProcessChecker
        this.setTotalRows = setTotalRows
        this.setProcessedRows = setProcessedRows
        this.setImportedRows = setImportedRows
        this.errorHandler = errorHandler

        this.progress = {
            min: 0,
            max: 100,
            current: 0,
            absProcessed: 0,
            absImported: 0,
            absTotal: 0,
        }

        this.tableData = []
        this.failedRows = []
    }

    hasColumnsHeaders () {
        return false
    }

    areColumnsHeadersValid (headersRow) {
        return true
    }

    /**
     * Transforms specific format to common format for mutation
     * @abstract
     * @protected
     * @param {string[]} row array of cells values of particular row (from xls, csv, etc.)
     * @throws {TransformRowError}
     * @return {RegisterMetersReadingsReadingInput | RegisterMetersReadingsReadingInput[]}
     */
    transformRow (row) {
        throw new Error('Not implemented')
    }

    async import (data) {
        try {
            this.tableData = data

            // proceeding headers shift - get start of proceeding point
            if (this.hasColumnsHeaders()) {
                const columns = this.tableData.shift()

                if (!columns) {
                    logger.error({ msg: this.errors.invalidColumns.message })
                    await this.errorHandler(this.errors.invalidColumns.message)
                    return
                }
                if (!this.areColumnsHeadersValid(columns)) {
                    logger.error({ msg: this.errors.invalidColumns.message })
                    await this.errorHandler(this.errors.invalidColumns.message)
                    return
                }
            }

            // empty data
            if (this.tableData.length === 0) {
                await this.errorHandler(this.errors.emptyRows.message)
                logger.error({ msg: this.errors.emptyRows.message })
                return
            }

            // set total in state & db in order to calc proceeding percentage on client side
            this.progress.absTotal = this.tableData.length
            await this.setTotalRows(this.progress.absTotal)

            // proceeding by chunks - since big amount of data can overload register mutation
            const sourceChunks = chunk(this.tableData, READINGS_CHUNK_SIZE)
            for (const sourceChunk of sourceChunks) {
                // prepare rows proceeding vars
                const transformedData = []
                const transformedRowToSourceRowMap = new Map()
                const indexesOfFailedSourceRows = new Set()
                let transformedIndex = 0

                // iterate over rows
                for (const sourceIndex in sourceChunk) {
                    const row = sourceChunk[sourceIndex]
                    try {
                        // map excel/csv row into register meter record format
                        const transformedRow = this.transformRow(row)

                        // sbbol row can hold multiply register meter records
                        if (isArray(transformedRow)) {
                            if (transformedRow.length === 0) {
                                logger.error({ msg: this.errors.invalidTypes.message })
                                this.failProcessingHandler({
                                    originalRow: row,
                                    errors: [this.errors.invalidTypes.message],
                                })
                            }
                            for (const rowPart of transformedRow) {
                                transformedData.push(rowPart)
                                transformedRowToSourceRowMap.set(
                                    String(transformedIndex++),
                                    sourceIndex
                                )
                            }
                        } else {
                            transformedData.push(transformedRow)
                            transformedRowToSourceRowMap.set(sourceIndex, sourceIndex)
                        }
                    } catch (err) {
                        logger.error({ msg: this.errors.invalidTypes.message, err })
                        this.failProcessingHandler({
                            originalRow: row,
                            // The `TransformRowError` contains `getMessages`
                            errors: err.getMessages ? err.getMessages() : [err.message],
                        })
                    }
                }

                // iterate over transformed meter records, chunk by chunk
                const transformedChunks = chunk(transformedData, READINGS_CHUNK_SIZE)
                for (const transformedChunk of transformedChunks) {
                    // firstly check if process is not cancelled
                    if (await this.breakProcessChecker()) {
                        return
                    }

                    // call register mutation
                    const transformedChunkResult = await this.importRows(transformedChunk)
                    const {
                        result,
                        errors,
                    } = transformedChunkResult

                    // there are two cases:
                    // - result rows exists - so we can iterate over them to check if particular row is imported
                    // - result is null and errors array present - fatal proceeding error
                    let errorIndex = 0
                    for (const transformedRowIndex in result) {
                        const resultRow = result[transformedRowIndex]
                        const sourceRowIndex = transformedRowToSourceRowMap.get(
                            transformedRowIndex
                        )

                        // in case if result row is empty - register error happens
                        // we have to take care of such rows in order to create errors file
                        if (!resultRow) {
                            const mutationError = errors[errorIndex++]
                            const messageForUser = get(mutationError, ['extensions', 'messageForUser'])
                            const rowErrors = []

                            if (messageForUser) {
                                rowErrors.push(messageForUser)
                            } else {
                                let mutationErrorMessages =
                                    get(mutationError, ['originalError', 'errors', 0, 'data', 'messages'], []) || []

                                // errors thrown to mutation from models
                                if (mutationErrorMessages.length === 0) {
                                    mutationErrorMessages = (get(mutationError, ['originalError', 'errors', 0, 'originalError', 'errors'], []) || []).reduce((result, error) => {
                                        return [
                                            ...result,
                                            get(error, ['extensions', 'messageForUser'], get(error, ['extensions', 'message'])),
                                        ]
                                    }, [])
                                }

                                for (const message of mutationErrorMessages) {
                                    const errorCodes = Object.keys(this.mutationErrorsToMessages)
                                    for (const code of errorCodes) {
                                        if (message.includes(code)) {
                                            rowErrors.push(this.mutationErrorsToMessages[code])
                                        } else if (!rowErrors.includes(message)) {
                                            rowErrors.push(message)
                                        }
                                    }
                                }

                                // fallback for not recognized errors
                                if (rowErrors.length === 0) {
                                    const error = get(mutationError, ['originalError', 'errors', 0, 'message'])
                                        || get(mutationError, ['message'], 'Unknown error')
                                    rowErrors.push(error)
                                }
                            }

                            // for sbbol import file we can have several transformed lines per one source line
                            // in such cases we would like to proceed exactly one failed line
                            if (!indexesOfFailedSourceRows.has(sourceRowIndex)) {
                                logger.error({ msg: 'Failed to import rows', errors: rowErrors })
                                await this.failProcessingHandler({
                                    originalRow: sourceChunk[sourceRowIndex],
                                    errors: rowErrors,
                                })
                                indexesOfFailedSourceRows.add(sourceRowIndex)
                            }
                        } else {
                            this.progress.absImported += 1
                        }
                    }
                }

                this.progress.absProcessed += sourceChunk.length
                await this.setProcessedRows(this.progress.absProcessed)
                await this.setImportedRows(this.progress.absImported)
            }

            // set 100% percent of proceeded lines
            await this.setProcessedRows(this.progress.absTotal)
        } catch (err) {
            logger.error({ msg: 'Failed to proceed import file', err })
            await this.errorHandler(
                get(err, 'errors[0].extensions.messageForUser', get(err, 'message')) || 'not recognized error'
            )
        }
    }

    failProcessingHandler (row) {
        this.failedRows.push(row)
    }

    fitToColumn (arrayOfArray) {
        return arrayOfArray[0].map((_, index) => (
            { wch: Math.max(...arrayOfArray.map(row => row[index] ? row[index].toString().length : 0)) }
        ))
    }

    async generateErrorFile () {
        const ErrorsMessage = i18n('import.Errors')
        const erroredRows =  this.failedRows
        const columnsHeaders = this.columnsHeaders
        const data = []
        if (columnsHeaders) {
            data.push(columnsHeaders.map(column => column.name).concat([ErrorsMessage]))
        }

        for (let i = 0; i < erroredRows.length; i++) {
            const line = erroredRows[i].originalRow.map((cell) => {
                if (!cell) return null
                return String(cell)
            })
            line.push(erroredRows[i].errors ? erroredRows[i].errors.join(', \n') : null)
            data.push(line)
        }

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet(data)
        ws['!cols'] = this.fitToColumn(data)
        XLSX.utils.book_append_sheet(wb, ws, 'table')
        return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    }
}

module.exports = {
    AbstractMetersImporter,
}
