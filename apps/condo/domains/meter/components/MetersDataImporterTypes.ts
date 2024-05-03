export enum ImportDataType {doma = 'doma', sbbol = 'sbbol'}

export type TOnMetersUpload = (dataType: ImportDataType, cols: string[][]) => void

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
}

interface ColumnInfo {
    name: string
    required: boolean
}
export type Columns = Array<ColumnInfo>
