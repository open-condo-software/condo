import { FetchResult } from '@apollo/client'
import { RegisterMetersReadingsOutput, RegisterMetersReadingsReadingInput } from '@app/condo/schema'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import isArray from 'lodash/isArray'

import { MutationErrorsToMessagesType } from '@condo/domains/common/utils/importer'
import {
    Columns,
    TImporterErrorMessage,
    TImporterErrorMessages,
    TMeterImporterMappers,
} from '@condo/domains/meter/components/MetersDataImporterTypes'

export type TableRow = string[]
export type ProcessedRow = {
    originalRow: TableRow
    errors?: Array<string>
}

type ProgressUpdateHandler = (progress: number) => void
type FinishHandler = () => void
type SuccessProcessingHandler = (row: TableRow) => void
type FailProcessingHandler = (row: ProcessedRow) => void
type ErrorHandler = (errorMessage: TImporterErrorMessage) => void

// A cell with "custom" column type will be skipped in basic types validation function
// to allow to implement custom validation in specific importer implementations.
type ColumnType = 'string' | 'number' | 'date' | 'custom'

const READINGS_CHUNK_SIZE = 100

export abstract class AbstractMetersImporter {
    constructor (
        protected readonly columnsHeaders: Columns,
        protected readonly mappers: TMeterImporterMappers,
        private importRows: (rows: RegisterMetersReadingsReadingInput[]) => Promise<FetchResult<{
            result: RegisterMetersReadingsOutput[]
        }>>,
        protected errors: TImporterErrorMessages,
        private mutationErrorsToMessages: MutationErrorsToMessagesType,
    ) {
    }

    protected progress = {
        min: 0,
        max: 100,
        current: 0,
        absProcessed: 0,
        absTotal: 0,
    }

    protected breakImport = false
    protected tableData: string[][] = []
    protected progressUpdateHandler: ProgressUpdateHandler
    protected finishHandler: FinishHandler
    protected errorHandler: ErrorHandler
    protected successProcessingHandler: SuccessProcessingHandler
    protected failProcessingHandler: FailProcessingHandler
    protected readonly columnsNames: Array<string>
    protected readonly columnsTypes: Array<ColumnType>
    protected readonly columnsRequired: Array<boolean>

    /**
     * Transforms specific format to common format for mutation
     * @param row array of cells values of particular row (from xls, csv, etc.)
     * @protected
     */
    protected abstract transformRow (row: string[]): RegisterMetersReadingsReadingInput | RegisterMetersReadingsReadingInput[]

    protected hasColumnsHeaders (): boolean {
        return false
    }

    protected areColumnsHeadersValid (headersRow: string[]): boolean {
        return true
    }

    public async import (data: string[][]): Promise<void> {
        this.tableData = data

        if (this.hasColumnsHeaders()) {
            const columns = this.tableData.shift()

            if (!columns) {
                this.errorHandler(this.errors.invalidColumns)
                return
            }
            if (!this.areColumnsHeadersValid(columns)) {
                this.errorHandler(this.errors.invalidColumns)
                return
            }
        }

        if (this.tableData.length === 0) {
            this.errorHandler(this.errors.emptyRows)
            return
        }

        this.progress.absTotal = this.tableData.length
        this.updateProgress(this.progress.min)

        const chunks = chunk(this.tableData, READINGS_CHUNK_SIZE)

        try {
            for (const chunk of chunks) {
                const transformedChunk: RegisterMetersReadingsReadingInput[] = []
                for (const row of chunk) {
                    const transformedRow = this.transformRow(row)
                    if (isArray(transformedRow)) {
                        for (const rowPart of transformedRow) {
                            transformedChunk.push(rowPart)
                        }
                    } else {
                        transformedChunk.push(transformedRow)
                    }
                }

                const chunkResult = await this.importRows(transformedChunk)
                const { data: { result }, errors } = chunkResult

                let errorIndex = 0
                for (const rowIndex in result) {
                    const resultRow = result[rowIndex]
                    if (resultRow) {
                        this.successProcessingHandler(chunk[rowIndex])
                    } else {
                        const mutationError = errors[errorIndex++]

                        const messageForUser = get(mutationError, ['extensions', 'messageForUser'])
                        const rowErrors = []

                        if (messageForUser) {
                            rowErrors.push(messageForUser)
                        } else {
                            const mutationErrorMessages = get(mutationError, ['originalError', 'errors', 0, 'data', 'messages'], []) || []
                            for (const message of mutationErrorMessages) {
                                const errorCodes = Object.keys(this.mutationErrorsToMessages)
                                for (const code of errorCodes) {
                                    if (message.includes(code)) {
                                        rowErrors.push(this.mutationErrorsToMessages[code])
                                    }
                                }
                            }
                        }

                        this.failProcessingHandler({ originalRow: chunk[rowIndex], errors: rowErrors })
                    }
                }

                this.progress.absProcessed += chunk.length
                this.updateProgress()

            }

            this.updateProgress(100)
            this.finishHandler()
        } catch (error) {
            this.errorHandler(error)
        }
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

    protected updateProgress (value?: number): void {
        if (value) {
            this.progress.current = value
        } else {
            this.progress.current = Math.min((this.progress.absProcessed / this.progress.absTotal) * this.progress.max, this.progress.max)
        }
        if (this.progressUpdateHandler) {
            this.progressUpdateHandler(this.progress.current)
        }
    }
}
