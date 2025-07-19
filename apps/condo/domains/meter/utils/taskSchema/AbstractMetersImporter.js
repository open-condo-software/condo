
const chunk = require('lodash/chunk')
const get = require('lodash/get')
const isArray = require('lodash/isArray')
const isNil = require('lodash/isNil')
const set = require('lodash/set')
const XLSX = require('xlsx')

const { getLogger } = require('@open-condo/keystone/logging')
const { i18n } = require('@open-condo/locales/loader')

const { clearDateStr, isDateStrValid, tryToISO } = require('@condo/domains/common/utils/import/date')
const { IMPORT_CONDO_METER_READING_SOURCE_ID } = require('@condo/domains/meter/constants/constants')
const { DATE_FIELD_PATHS } = require('@condo/domains/meter/constants/registerMetersReadingsService')

const READINGS_CHUNK_SIZE = 100
const READING_SOURCE = { id: IMPORT_CONDO_METER_READING_SOURCE_ID }
const logger = getLogger()

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
        dateColumnsByReadingDatePaths,
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
        this.dateColumnsTranslationsByPath = dateColumnsByReadingDatePaths

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

    getInvalidDatesPaths (reading) {
        return DATE_FIELD_PATHS.reduce((datesPaths, { path, nullable }) => {
            const dateStr = get(reading, path)

            if (!nullable && isNil(dateStr)) {
                datesPaths.push(path)
                return datesPaths
            }

            const clearedDate = clearDateStr(dateStr)
            const dateIsEmpty = isNil(dateStr) || !clearedDate
            if (nullable && dateIsEmpty) {
                return datesPaths
            }

            if (!isDateStrValid(clearedDate)) {
                datesPaths.push(path)
                return datesPaths
            }

            return datesPaths
        }, [])
    }

    /**
     * Converts dates to UTC if they are valid, otherwise to undefined
     * @param {RegisterMetersReadingsReadingInput} data
     */
    convertDatesToISOOrUndefined (data) {
        DATE_FIELD_PATHS.forEach(({ path }) => {
            const date = get(data, path)
            set(data, path, tryToISO(clearDateStr(date)))
        })
    }

    prepareReading (rowPart) {
        this.convertDatesToISOOrUndefined(rowPart)
        rowPart.readingSource = READING_SOURCE
        return rowPart
    }

    validateReading (rowPart) {
        const invalidDatesPaths = this.getInvalidDatesPaths(rowPart)
        const invalidDatesColumns = invalidDatesPaths.map(path => this.dateColumnsTranslationsByPath[path])
        const errors = []
        if (invalidDatesPaths.length > 0) {
            const columnNamesInError = invalidDatesColumns.join('", "')
            errors.push(this.errors.invalidDate.get(columnNamesInError))
        }
        return errors
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
                        let transformedRow = this.transformRow(row)
                        // sbbol row can hold multiply register meter records
                        if (!isArray(transformedRow)) {
                            transformedRow = [transformedRow]
                        }

                        if (transformedRow.length === 0) {
                            logger.error({ msg: this.errors.invalidTypes.message })
                            this.failProcessingHandler({
                                originalRow: row,
                                errors: [this.errors.invalidTypes.message],
                            })
                            indexesOfFailedSourceRows.add(sourceIndex)
                        }

                        for (const rowPart of transformedRow) {
                            const validationErrors = this.validateReading(rowPart)
                            if (validationErrors.length) {
                                this.failProcessingHandler({
                                    originalRow: row,
                                    errors: validationErrors,
                                })
                                indexesOfFailedSourceRows.add(sourceIndex)
                                continue
                            }
                            transformedData.push(this.prepareReading(rowPart))
                            transformedRowToSourceRowMap.set(
                                transformedIndex,
                                sourceIndex
                            )
                            transformedIndex++
                        }

                    } catch (err) {
                        logger.error({ msg: this.errors.invalidTypes.message, err })
                        this.failProcessingHandler({
                            originalRow: row,
                            // The `TransformRowError` contains `getMessages`
                            errors: err.getMessages ? err.getMessages() : [err.message],
                        })
                        indexesOfFailedSourceRows.add(sourceIndex)
                    }
                }

                // iterate over transformed meter records, chunk by chunk
                const transformedChunks = chunk(transformedData, READINGS_CHUNK_SIZE)
                let processedTransformedIndex = 0
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
                    for (const resultRow of result) {
                        const sourceRowIndex = transformedRowToSourceRowMap.get(processedTransformedIndex)

                        // in case if result row is empty - register error happens
                        // we have to take care of such rows in order to create errors file
                        if (!resultRow) {
                            const mutationError = errors[errorIndex++]
                            const message = get(mutationError, ['message'])
                            const internalMessage = get(mutationError, ['extensions', 'message'])
                            const messageForUser = get(mutationError, ['extensions', 'messageForUser'])

                            const originalError = get(mutationError, ['originalError', 'errors', 0, 'originalError', 'errors', 0])
                            const originalMessage = get(originalError, ['message'])
                            const originalInternalMessage = get(originalError, ['extensions', 'message'])
                            const originalMessageForUser = get(originalError, ['extensions', 'messageForUser'])

                            // We need to show as understandable error as possible
                            const rowErrors = [originalMessageForUser || originalInternalMessage || originalMessage || messageForUser || internalMessage || message]

                            // for sbbol import file we can have several transformed lines per one source line
                            // in such cases we would like to proceed exactly one failed line
                            if (!indexesOfFailedSourceRows.has(sourceRowIndex)) {
                                logger.error({ msg: 'failed to import rows', data: { errors: rowErrors } })
                                await this.failProcessingHandler({
                                    originalRow: sourceChunk[sourceRowIndex],
                                    errors: rowErrors,
                                })
                                indexesOfFailedSourceRows.add(sourceRowIndex)
                            }
                        } else {
                            this.progress.absImported += 1
                        }

                        processedTransformedIndex++
                    }
                }

                this.progress.absProcessed += sourceChunk.length
                await this.setProcessedRows(this.progress.absProcessed)
                await this.setImportedRows(this.progress.absImported)
            }

            // set 100% percent of proceeded lines
            await this.setProcessedRows(this.progress.absTotal)
        } catch (err) {
            logger.error({ msg: 'failed to proceed import file', err })
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
