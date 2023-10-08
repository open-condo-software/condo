import dayjs from 'dayjs'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'

export type TableRow = Array<Record<'value', string | number | Date>>
export type ProcessedRow = {
    row: TableRow
    addons?: { [id: string]: any }
    shouldBeReported?: boolean
    errors?: Array<string>
}

export type ProgressUpdateHandler = (progress: number) => void
export type FinishHandler = () => void
export type SuccessProcessingHandler = (row: TableRow) => void
export type FailProcessingHandler = (row: ProcessedRow) => void
export type ErrorHandler = (error: Error) => void
export type RowNormalizer = (row: TableRow) => Promise<ProcessedRow>
export type RowValidator = (row: ProcessedRow) => Promise<boolean>
export type ObjectCreator = (row: ProcessedRow) => Promise<unknown>
export type Columns = Array<ColumnInfo>
export type ImporterErrorMessages = {
    invalidColumns: string
    tooManyRows: string
    invalidTypes: string
}
export type MutationErrorsToMessagesType = { [errorCode: string]: string }

interface IImporter {
    import: (data: Array<TableRow>) => Promise<void>
    onProgressUpdate: (handleProgressUpdate: ProgressUpdateHandler) => void
    onFinish: (handleFinish: FinishHandler) => void
    onError: (handleError: ErrorHandler) => void
    break: () => void
}

// A cell with "custom" column type will be skipped in basic types validation function
// to allow to implement custom validation in specific importer implementations.
type ColumnType = 'string' | 'number' | 'date' | 'custom'

export const DATE_PARSING_FORMAT = 'YYYY-MM-DD'

export interface ColumnInfo {
    name: string
    type: ColumnType
    required: boolean
}


export class Importer implements IImporter {
    constructor (
        columnsTemplate: Columns,
        private rowNormalizer: RowNormalizer,
        private rowValidator: RowValidator,
        private objectCreator: ObjectCreator,
        private errors: ImporterErrorMessages,
        private mutationErrorsToMessages: MutationErrorsToMessagesType,
        private sleepInterval: number,
        private maxTableLength: number,
    ) {
        this.columnsNames = columnsTemplate.map(column => column.name.trim().toLowerCase())
        this.columnsTypes = columnsTemplate.map(column => column.type)
        this.columnsRequired = columnsTemplate.map(column => column.required)
    }

    private progress = {
        min: 0,
        max: 100,
        current: 0,
    }

    private breakImport = false
    private tableData: Array<TableRow> = []
    private progressUpdateHandler: ProgressUpdateHandler
    private finishHandler: FinishHandler
    private errorHandler: ErrorHandler
    private successProcessingHandler: SuccessProcessingHandler
    private failProcessingHandler: FailProcessingHandler
    private readonly columnsNames: Array<string>
    private readonly columnsTypes: Array<ColumnType>
    private readonly columnsRequired: Array<boolean>

    public import (data: Array<TableRow>): Promise<void> {
        this.tableData = data
        const [columns, ...body] = this.tableData
        if (!columns) {
            this.errorHandler(new Error(this.errors.invalidColumns))
            return
        }
        if (!this.isColumnsValid(columns)) {
            this.errorHandler(new Error(this.errors.invalidColumns))
            return
        }

        if (body.length > this.maxTableLength) {
            this.errorHandler(new Error(this.errors.tooManyRows))
            return
        }

        return this.createRecord(cloneDeep(body)).catch(error => {
            this.errorHandler(error)
        })
    }

    public break (): void {
        this.breakImport = true
    }

    public onError (handleError: ErrorHandler): void {
        this.errorHandler = handleError
    }

    public onFinish (handleFinish: FinishHandler): void {
        this.finishHandler = handleFinish
    }

    public onRowProcessed (handleSuccess: SuccessProcessingHandler): void {
        this.successProcessingHandler = handleSuccess
    }

    public onRowFailed (handleFail: FailProcessingHandler): void {
        this.failProcessingHandler = handleFail
    }

    public onProgressUpdate (handleProgressUpdate: ProgressUpdateHandler): void {
        this.progressUpdateHandler = handleProgressUpdate
    }

    private isColumnsValid (row: TableRow): boolean {
        const normalizedColumns = row.map(({ value }) => {
            if (typeof value === 'string') {
                return value.trim().toLowerCase()
            }
            return value
        })
        return isEqual(this.columnsNames, normalizedColumns)
    }

    private parseAndValidateRow (row: TableRow): boolean {
        for (let i = 0; i < row.length; i++) {
            // Because `typeof` returns 'object' for instances of `Date`, data type is set explicitly
            const valueType = row[i].value instanceof Date ? 'date' : typeof row[i].value
            if (row[i].value === undefined && this.columnsRequired[i]) {
                return false
            } else if (this.columnsTypes[i] === 'custom') {
                return true
            } else if (this.columnsTypes[i] === 'string' && valueType === 'number') {
                row[i].value = String(row[i].value)
            } else if (this.columnsTypes[i] === 'date' && valueType === 'string') {
                row[i].value = dayjs(row[i].value, DATE_PARSING_FORMAT).toDate()
            } else if (valueType !== 'undefined' && valueType !== this.columnsTypes[i]) {
                return false
            }
        }
        return true
    }

    private updateProgress (value?: number) {
        if (value) {
            this.progress.current = value
        } else {
            const totalRows = Math.max(this.tableData.length - 1, 1)
            const step = 100 / totalRows
            const newProgress = this.progress.current + step
            this.progress.current = Math.min(newProgress, 100)
        }
        if (this.progressUpdateHandler) {
            this.progressUpdateHandler(this.progress.current)
        }
    }

    // TODO: remove `index`, it is not used
    private async createRecord (table, index = 0) {
        if (this.breakImport) {
            return Promise.resolve()
        }

        if (!table.length) {
            this.updateProgress(100)
            this.finishHandler()
            return Promise.resolve()
        }

        const row = table.shift()

        if (!this.parseAndValidateRow(row)) {
            if (this.failProcessingHandler) {
                this.failProcessingHandler({ row, errors: [this.errors.invalidTypes] })
            }
            return this.createRecord(table, index++)
        }
        return this.rowNormalizer(row)
            .then(normalizedRow => {
                return this.rowValidator(normalizedRow)
                    .then(isValid => {
                        if (isValid) {
                            return this.objectCreator(normalizedRow)
                                .then(() => {
                                    if (normalizedRow.shouldBeReported && this.failProcessingHandler) {
                                        this.failProcessingHandler(normalizedRow)
                                    }
                                    if (this.successProcessingHandler) {
                                        this.successProcessingHandler(row)
                                    }
                                    return Promise.resolve()
                                })
                                .catch((e) => {
                                    try {
                                        const mutationErrors = get(e, 'graphQLErrors', []) || []
                                        if (!isArray(mutationErrors) || isEmpty(mutationErrors)) {
                                            console.warn('No "graphQLErrors" for formatting errors')
                                            console.error(e)
                                        }
                                        normalizedRow.errors = normalizedRow.errors || []

                                        mutationErrors.forEach(mutationError => {
                                            const mutationErrorMessages = get(mutationError, ['data', 'messages'], []) || []
                                            mutationErrorMessages.forEach(message => {
                                                const errorCodes = Object.keys(this.mutationErrorsToMessages)

                                                errorCodes.forEach(code => {
                                                    if (message.includes(code)) {
                                                        normalizedRow.errors.push(this.mutationErrorsToMessages[code])
                                                    }
                                                })
                                            })
                                        })
                                    } catch (error) {
                                        console.debug('Error when formatting errors from "graphQLErrors"', {
                                            row,
                                            normalizedRow,
                                            isValid,
                                        })
                                        console.error(error)
                                        console.error(e)
                                    }

                                    if (this.failProcessingHandler) {
                                        this.failProcessingHandler(normalizedRow)
                                        return Promise.resolve()
                                    }
                                })
                        } else {
                            if (this.failProcessingHandler) {
                                this.failProcessingHandler(normalizedRow)
                                return Promise.resolve()
                            }
                        }
                    })
            })
            .then(() => {
                this.updateProgress()
            })
            .then(() => {
                return sleep(this.sleepInterval)
            })
            .then(() => {
                return this.createRecord(table, index++)
            })
            .catch((error) => {
                this.errorHandler(error)
            })

    }

}

function sleep (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
