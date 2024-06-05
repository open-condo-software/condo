const { chunk, get, isArray } = require('lodash')
const XLSX = require('xlsx')

const { i18n } = require('@open-condo/locales/loader')

const READINGS_CHUNK_SIZE = 100

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
        this.errorHandler = errorHandler

        this.progress = {
            min: 0,
            max: 100,
            current: 0,
            absProcessed: 0,
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

    async import (data) {
        try {
            this.tableData = data

            // proceeding headers shift - get start of proceeding point
            if (this.hasColumnsHeaders()) {
                const columns = this.tableData.shift()

                if (!columns) {
                    await this.errorHandler(this.errors.invalidColumns)
                    return
                }
                if (!this.areColumnsHeadersValid(columns)) {
                    await this.errorHandler(this.errors.invalidColumns)
                    return
                }
            }

            // empty data
            if (this.tableData.length === 0) {
                await this.errorHandler(this.errors.emptyRows)
                return
            }

            // set total in state & db in order to calc proceeding percentage on client side
            this.progress.absTotal = this.tableData.length
            await this.setTotalRows(this.progress.absTotal)

            // proceeding by chunks - since big amount of data can overload register mutation
            const sourceChunks = chunk(this.tableData, READINGS_CHUNK_SIZE)
            for (const sourceChunk of sourceChunks) {
                // firstly check if process is not cancelled
                if (await this.breakProcessChecker()) {
                    return
                }

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
                        this.failProcessingHandler({
                            originalRow: row,
                            errors: err.getMessages(),
                        })
                    }
                }

                // iterate over transformed meter records, chunk by chunk
                const transformedChunks = chunk(transformedData, READINGS_CHUNK_SIZE)
                for (const transformedChunk of transformedChunks) {
                    // call register mutation
                    const transformedChunkResult = await this.importRows(transformedChunk)
                    const {
                        result,
                        errors,
                    } = transformedChunkResult

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
                                const mutationErrorMessages =
                                    get(mutationError, ['originalError', 'errors', 0, 'data', 'messages'], []) || []
                                for (const message of mutationErrorMessages) {
                                    const errorCodes = Object.keys(this.mutationErrorsToMessages)
                                    for (const code of errorCodes) {
                                        if (message.includes(code)) {
                                            rowErrors.push(this.mutationErrorsToMessages[code])
                                        }
                                    }
                                }
                            }

                            if (!indexesOfFailedSourceRows.has(sourceRowIndex)) {
                                await this.failProcessingHandler({
                                    originalRow: sourceChunk[sourceRowIndex],
                                    errors: rowErrors,
                                })
                                indexesOfFailedSourceRows.add(sourceRowIndex)
                            }
                        }
                    }
                }

                this.progress.absProcessed += sourceChunk.length
                await this.setProcessedRows(this.progress.absProcessed)
            }

            // set 100% percent of proceeded lines
            await this.setProcessedRows(this.progress.absTotal)
        } catch (error) {
            await this.errorHandler(
                get(error, 'errors[0].extensions.messageForUser', get(error, 'message')) || 'not recognized error'
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
        return XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })
    }
}

module.exports = {
    AbstractMetersImporter,
}