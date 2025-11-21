import dayjs from 'dayjs'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import pick from 'lodash/pick'

export type TableRow = Array<Record<'value', string | number | Date>>
export type ProcessedRow = {
    originalRow: TableRow
    row: TableRow
    addons?: { [id: string]: any }
    shouldBeReported?: boolean
    errors?: Array<string>
}

type ImporterErrorMessage = { title?: string, message: string }
export type ImporterErrorMessages = {
    invalidColumns: ImporterErrorMessage
    tooManyRows: ImporterErrorMessage
    invalidTypes: ImporterErrorMessage
    normalization: ImporterErrorMessage
    validation: ImporterErrorMessage
    creation: ImporterErrorMessage
    emptyRows: ImporterErrorMessage
}
export type ProgressUpdateHandler = (progress: number) => void
export type FinishHandler = () => void
export type SuccessProcessingHandler = (row: TableRow) => void
export type FailProcessingHandler = (row: ProcessedRow) => void
export type ErrorHandler = (errorMessage: ImporterErrorMessage) => void
export type RowNormalizer = (row: TableRow) => Promise<Pick<ProcessedRow, 'addons' | 'shouldBeReported' | 'row'>>
export type RowValidator = (row: ProcessedRow) => Promise<boolean>
export type ObjectCreator = (row: ProcessedRow) => Promise<unknown>
export type Columns = Array<ColumnInfo>
export type MutationErrorsToMessagesType = { [errorCode: string]: string }

export interface IImporter {
    import: (data: Array<TableRow>) => Promise<void>
    onProgressUpdate: (handleProgressUpdate: ProgressUpdateHandler) => void
    onFinish: (handleFinish: FinishHandler) => void
    onError: (handleError: ErrorHandler) => void
    break: () => void
}

// A cell with "custom" column type will be skipped in basic types validation function
// to allow to implement custom validation in specific importer implementations.
type ColumnType = 'string' | 'number' | 'date' | 'custom'

export const ISO_DATE_FORMAT = 'YYYY-MM-DD'
export const EUROPEAN_DATE_FORMAT = 'DD.MM.YYYY'

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
        headerRowIndex: number
    ) {
        this.headerRowIndex = headerRowIndex
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
    private readonly headerRowIndex: number
    private readonly columnsNames: Array<string>
    private readonly columnsTypes: Array<ColumnType>
    private readonly columnsRequired: Array<boolean>

    public import (data: Array<TableRow>): Promise<void> {
        this.tableData = data

        const columns = this.tableData[this.headerRowIndex]
        const body = this.tableData.slice(this.headerRowIndex + 1)

        if (!columns || columns.length === 0) {
            this.errorHandler(this.errors.invalidColumns)
            return
        }
        if (!this.isColumnsValid(columns)) {
            this.errorHandler(this.errors.invalidColumns)
            return
        }

        if (body.length === 0) {
            this.errorHandler(this.errors.emptyRows)
            return
        }

        if (body.length > this.maxTableLength) {
            this.errorHandler(this.errors.tooManyRows)
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
                continue
            } else if (this.columnsTypes[i] === 'string' && valueType === 'number') {
                row[i].value = String(row[i].value)
            } else if (this.columnsTypes[i] === 'date' && valueType === 'string') {
                // NOTE: We support only 2 formats of date: "YYYY-MM-DD" and "DD.MM.YYYY"
                if (dayjs(row[i].value, ISO_DATE_FORMAT, true).isValid()) {
                    row[i].value = dayjs(row[i].value, ISO_DATE_FORMAT, true).toDate()
                } else if (dayjs(row[i].value, EUROPEAN_DATE_FORMAT, true).isValid()) {
                    row[i].value = dayjs(row[i].value, EUROPEAN_DATE_FORMAT, true).toDate()
                } else {
                    return false
                }
            } else if (valueType !== 'undefined' && valueType !== this.columnsTypes[i]) {
                return false
            }
        }
        return true
    }

    private updateProgress (value?: number): void {
        if (value) {
            this.progress.current = value
        } else {
            const totalRows = Math.max(this.tableData.length - (this.headerRowIndex + 1), 1)
            const step = 100 / totalRows
            const newProgress = this.progress.current + step
            this.progress.current = Math.min(newProgress, 100)
        }
        if (this.progressUpdateHandler) {
            this.progressUpdateHandler(this.progress.current)
        }
    }

    private async createRecord (table): Promise<void> {
        if (this.breakImport) {
            return
        }

        if (!table.length) {
            this.updateProgress(100)
            this.finishHandler()
            return
        }

        const row = table.shift()
        const originalRow = cloneDeep(row)

        if (!this.parseAndValidateRow(row)) {
            if (this.failProcessingHandler) {
                this.failProcessingHandler({ row, originalRow, errors: [this.errors.invalidTypes.message] })
            }
            return this.createRecord(table)
        }

        let processedRow: ProcessedRow = { row, originalRow, errors: [] }
        let isValidRow = false
        let isNormalizedRow = false

        try {
            const normalizedData = await this.rowNormalizer(row)
            processedRow = {
                ...processedRow,
                ...pick(normalizedData, ['row', 'addons', 'shouldBeReported']),
            }
            isNormalizedRow = true
        } catch (error) {
            console.error('Unexpected error in "rowNormalizer"!')
            console.error(error)
            // NOTE: The browser console doesn't show all the properties of the error object,
            // so we use a little hack :)
            console.debug('Error details from "rowNormalizer":', { error, originalRow })
            processedRow.errors.push(this.errors.normalization.message)
        }

        if (isNormalizedRow) {
            try {
                isValidRow = await this.rowValidator(processedRow)
            } catch (error) {
                console.error('Unexpected error in "rowValidator"!')
                console.error(error)
                console.debug('Error details from "rowValidator":', { error, originalRow })
                processedRow.errors.push(this.errors.validation.message)
            }
        }

        if (isNormalizedRow && isValidRow) {
            try {
                await sleep(this.sleepInterval)

                await this.objectCreator(processedRow)

                if (processedRow.shouldBeReported && this.failProcessingHandler) {
                    this.failProcessingHandler(processedRow)
                }
                if (this.successProcessingHandler) {
                    this.successProcessingHandler(row)
                }
            } catch (error) {
                console.error('Unexpected error in "objectCreator"!')
                console.error(error)
                console.debug('Error details from "objectCreator":', { error, originalRow })
                const mutationErrors = get(error, 'graphQLErrors', []) || []

                for (const mutationError of mutationErrors) {
                    const messageForUser = get(mutationError, 'extensions.messageForUser')

                    if (messageForUser) {
                        processedRow.errors.push(messageForUser)
                    } else {
                        const mutationErrorMessages = get(mutationError, ['data', 'messages'], []) || []
                        for (const message of mutationErrorMessages) {
                            const errorCodes = Object.keys(this.mutationErrorsToMessages)
                            for (const code of errorCodes) {
                                if (message.includes(code)) {
                                    processedRow.errors.push(this.mutationErrorsToMessages[code])
                                }
                            }
                        }
                    }
                }

                if (processedRow.errors.length < 1) {
                    processedRow.errors.push(this.errors.creation.message)
                }

                if (this.failProcessingHandler) {
                    this.failProcessingHandler(processedRow)
                }
            }
        } else {
            if (this.failProcessingHandler) {
                this.failProcessingHandler(processedRow)
            }
        }

        this.updateProgress()

        await sleep(this.sleepInterval)

        return this.createRecord(table)
    }

}

function sleep (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
