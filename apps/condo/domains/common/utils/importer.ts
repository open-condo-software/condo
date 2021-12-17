import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'
import dayjs from 'dayjs'

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

interface IImporter {
    import: (data: Array<TableRow>) => Promise<void>
    onProgressUpdate: (handleProgressUpdate: ProgressUpdateHandler) => void
    onFinish: (handleFinish: FinishHandler) => void
    onError: (handleError: ErrorHandler) => void
    break: () => void
}

type ColumnType = 'string' | 'number' | 'date'

const DATE_PARSING_FORMAT = 'DD.MM.YYYY'

export interface ColumnInfo {
    name: string
    type: ColumnType
    required: boolean
    label: string
}

const SLEEP_INTERVAL_BEFORE_QUERIES = 300
export const MAX_TABLE_LENGTH = 500

export class Importer implements IImporter {
    constructor (
        columnsTemplate: Columns,
        private rowNormalizer: RowNormalizer,
        private rowValidator: RowValidator,
        private objectCreator: ObjectCreator,
        private errors: ImporterErrorMessages,
        private sleepInterval: number = SLEEP_INTERVAL_BEFORE_QUERIES,
        private maxTableLength: number = MAX_TABLE_LENGTH
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

    private isRowValid (row: TableRow): boolean {
        for (let i = 0; i < row.length; i++) {
            if (row[i].value === undefined && this.columnsRequired[i]) {
                return false
            }
            if (typeof row[i].value === 'number' && this.columnsTypes[i] === 'string') {
                row[i].value = String(row[i].value)
            } else if (typeof row[i].value === 'string' && this.columnsTypes[i] === 'date') {
                row[i].value = dayjs(row[i].value, DATE_PARSING_FORMAT).toDate()
            } else if (typeof row[i].value !== 'undefined' && typeof row[i].value !== this.columnsTypes[i]) {
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

        if (!this.isRowValid(row)) {
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
                            return this.objectCreator(normalizedRow).then(() => {
                                if (normalizedRow.shouldBeReported && this.failProcessingHandler) {
                                    this.failProcessingHandler(normalizedRow)
                                }
                                if (this.successProcessingHandler) {
                                    this.successProcessingHandler(row)
                                }
                                return Promise.resolve()
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
