import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'

export type TableRow = Array<Record<'value', string | number>>
export type ProcessedRow = {
    row: TableRow
    addons: { [name: string]: JSON }
}

export type ProgressUpdateHandler = (progress: number) => void
export type FinishHandler = () => void
export type ErrorHandler = (error: Error) => void
export type RowNormalizer = (row: TableRow) => Promise<ProcessedRow | null>
export type RowValidator = (row: ProcessedRow) => Promise<boolean>
export type ObjectCreator = (row: ProcessedRow) => Promise<void>

interface IImporter {
    import: (data: Array<TableRow>) => Promise<void>
    onProgressUpdate: (handleProgressUpdate: ProgressUpdateHandler) => void
    onFinish: (handleFinish: FinishHandler) => void
    onError: (handleError: ErrorHandler) => void
    break: () => void
}

export interface ColumnInfo {
    name: string
    type: 'string' | 'number'
}

const SLEEP_INTERVAL_BEFORE_QUERIES = 300

export class Importer implements IImporter {
    constructor (
        columnsTemplate: Array<ColumnInfo>,
        rowNormalizer: RowNormalizer,
        rowValidator: RowValidator,
        objectCreator: ObjectCreator,
    ) {
        this.columnsNames = columnsTemplate.map(column => column.name.trim().toLowerCase())
        this.columnsTypes = columnsTemplate.map(column => column.type)
        this.rowNormalizer = rowNormalizer
        this.rowValidator = rowValidator
        this.objectCreator = objectCreator
    }
    // Initial values of importer
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
    private readonly columnsNames: Array<string>
    private readonly columnsTypes: Array<'string' | 'number'>
    private readonly rowNormalizer: (row: TableRow) => Promise<ProcessedRow | null>
    private readonly rowValidator: (row: ProcessedRow) => Promise<boolean>
    private readonly objectCreator: (row: ProcessedRow) => Promise<void>

    // Handle importing table
    public import (data: Array<TableRow>): Promise<void> {
        this.tableData = data
        const [columns, ...body] = this.tableData

        if (!this.isColumnsValid(columns)) {
            // TODO (savelevmatthew): Add correct code / translations?
            this.errorHandler(new Error('Invalid columns name!'))
            return
        }

        return this.createRecord(cloneDeep(body)).catch(error => {
            this.errorHandler(error)
        })
    }

    // Handle stopping import
    public break (): void {
        this.breakImport = true
    }

    // Handle error throwing
    public onError (handleError: ErrorHandler): void {
        this.errorHandler = handleError
    }

    // Handle finish importing
    public onFinish (handleFinish: FinishHandler): void {
        this.finishHandler = handleFinish
    }

    // Handle progress update
    public onProgressUpdate (handleProgressUpdate: ProgressUpdateHandler): void {
        this.progressUpdateHandler = handleProgressUpdate
    }

    // Checking table columns to match template
    private isColumnsValid (row: TableRow): boolean {
        const normalizedColumns = row.map(({ value }) => {
            if (typeof value === 'string') {
                return value.trim().toLowerCase()
            }
            return value
        })
        return isEqual(this.columnsNames, normalizedColumns)
    }

    // Checking inputs matching with data types
    private isRowValid (row: TableRow): boolean {
        for (let i = 0; i < row.length; i++) {
            if (typeof row[i].value !== this.columnsTypes[i]) return false
        }
        return true
    }

    // Updating progress
    private updateProgress (value?: number) {
        if (value) {
            this.progress.current = value
        } else {
            const totalRows = Math.max(this.tableData.length - 1, 1)
            const step = 100 / totalRows
            const newProgress = this.progress.current + step
            this.progress.current = Math.min(newProgress, 100)
        }
        this.progressUpdateHandler(this.progress.current)
    }

    // Converting table row to db row
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
            // TODO (savelevmatthew) Inform users later
            return this.createRecord(table, index++)
        }

        return this.rowNormalizer(row)
            .then(normalizedRow => {
                return this.rowValidator(normalizedRow)
                    .then(isValid => {
                        if (isValid) {
                            return this.objectCreator(normalizedRow)
                        }
                        return Promise.resolve()
                    })
            })
            .then(() => {
                this.updateProgress()
            })
            .then(() => {
                return sleep(SLEEP_INTERVAL_BEFORE_QUERIES)
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