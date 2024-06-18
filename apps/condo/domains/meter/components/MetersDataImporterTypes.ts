import { File } from '@app/condo/schema'

export type TOnMetersUpload = (blob: File) => void

export interface IMeterDataImporterProps {
    onUpload: TOnMetersUpload,
}

export type TMeterImporterMappers = {
    unitType: Record<string, string>
    resourceId: Record<string, string>
}

export type TImporterErrorMessage = { title?: string, message: string }

export type TImporterErrorMessages = {
    invalidColumns: TImporterErrorMessage
    tooManyRows: TImporterErrorMessage
    invalidTypes: TImporterErrorMessage
    normalization: TImporterErrorMessage
    validation: TImporterErrorMessage
    creation: TImporterErrorMessage
    emptyRows: TImporterErrorMessage
    unknownResource: TImporterErrorMessage
    unknownUnitType: TImporterErrorMessage
}

export class TransformRowError extends Error {
    private readonly messages: string[]

    constructor (messages: string[]) {
        super(`Errors: ${messages.join(', ')}`)
        this.messages = messages
    }

    getMessages (): string[] {
        return this.messages
    }
}

interface ColumnInfo {
    name: string
    required: boolean
}
export type Columns = Array<ColumnInfo>
