import { useCallback, useRef, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'

import { BIGGER_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/featureflags'
import { DEFAULT_RECORDS_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/import'
import {
    Importer,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    Columns,
    ProcessedRow,
    ImporterErrorMessages, MutationErrorsToMessagesType,
} from '@condo/domains/common/utils/importer'


const SLEEP_INTERVAL_BEFORE_QUERIES = 1000

interface IUseImporterProps {
    columns: Columns
    headerRowIndex: number
    rowNormalizer: RowNormalizer
    rowValidator: RowValidator
    objectCreator: ObjectCreator
    setTotalRows: (number) => void
    setSuccessRows: () => void
    handleRowError: (row: ProcessedRow) => void
    onFinish: () => void
    onError: () => void
    mutationErrorsToMessages?: MutationErrorsToMessagesType
}

export const useImporter = ({
    columns,
    headerRowIndex,
    rowNormalizer,
    rowValidator,
    objectCreator,
    setTotalRows,
    setSuccessRows,
    handleRowError,
    onFinish,
    onError,
    mutationErrorsToMessages,
}: IUseImporterProps) => {
    const { useFlagValue } = useFeatureFlags()
    const maxTableLength: number = useFlagValue(BIGGER_LIMIT_FOR_IMPORT) || DEFAULT_RECORDS_LIMIT_FOR_IMPORT
    
    const intl = useIntl()
    const TooManyRowsErrorTitle = intl.formatMessage({ id: 'TooManyRowsInTable.title' })
    const TooManyRowsErrorMessage = intl.formatMessage({ id: 'TooManyRowsInTable.message' }, {
        value: maxTableLength,
    })
    const InvalidHeadersErrorTitle = intl.formatMessage({ id: 'TableHasInvalidHeaders.title' })
    const InvalidHeadersErrorMessage = intl.formatMessage({ id: 'TableHasInvalidHeaders.message' }, {
        value: columns.map(column => `"${column.name}"`).join(', '),
    })
    const EmptyRowsErrorTitle = intl.formatMessage({ id: 'EmptyRows.title' })
    const EmptyRowsErrorMessage = intl.formatMessage({ id: 'EmptyRows.message' })
    const NotValidRowTypesMessage = intl.formatMessage({ id:'errors.import.InvalidColumnTypes' })
    const NormalizationErrorMessage = intl.formatMessage({ id:'errors.import.NormalizationError' })
    const ValidationErrorMessage = intl.formatMessage({ id:'errors.import.ValidationError' })
    const CreationErrorMessage = intl.formatMessage({ id:'errors.import.CreationError' })

    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    const [isImported, setIsImported] = useState(false)
    const importer = useRef(null)
    const errors: ImporterErrorMessages = {
        tooManyRows: { title: TooManyRowsErrorTitle, message: TooManyRowsErrorMessage },
        invalidColumns: { title: InvalidHeadersErrorTitle, message: InvalidHeadersErrorMessage },
        invalidTypes: { message: NotValidRowTypesMessage },
        normalization: { message: NormalizationErrorMessage },
        validation: { message: ValidationErrorMessage },
        creation: { message: CreationErrorMessage },
        emptyRows: { title: EmptyRowsErrorTitle, message: EmptyRowsErrorMessage },
    }

    const importData = useCallback((data) => {
        importer.current = null
        // reset hook state
        setIsImported(false)
        setError(null)
        setProgress(0)
        setTotalRows(Math.max(0, data.length - (headerRowIndex + 1)))

        importer.current = new Importer(columns, rowNormalizer, rowValidator, objectCreator, errors, mutationErrorsToMessages, SLEEP_INTERVAL_BEFORE_QUERIES, maxTableLength, headerRowIndex)
        importer.current.onProgressUpdate(setProgress)
        importer.current.onError((e) => {
            importer.current = null
            setError(e)

            onError()
        })
        importer.current.onFinish(() => {
            importer.current = null
            setIsImported(true)

            onFinish()
        })
        importer.current.onRowProcessed(() => {
            setSuccessRows()
        })
        importer.current.onRowFailed((row) => {
            handleRowError(row)
        })
        importer.current.import(data)
    }, [])

    const breakImport = () => {
        if (importer) {
            importer.current.break()
        }
    }

    return [importData, progress, error, isImported, breakImport]
}