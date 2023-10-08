import { useCallback, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    Importer,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    Columns,
    ProcessedRow,
    ImporterErrorMessages, MutationErrorsToMessagesType,
} from '@condo/domains/common/utils/importer'

const SLEEP_INTERVAL_BEFORE_QUERIES = 300

interface IUseImporterProps {
    columns: Columns,
    maxTableLength: number,
    rowNormalizer: RowNormalizer,
    rowValidator: RowValidator,
    objectCreator: ObjectCreator,
    setTotalRows: (number) => void,
    setSuccessRows: () => void,
    handleRowError: (row: ProcessedRow) => void,
    onFinish: () => void,
    onError: () => void,
    mutationErrorsToMessages?: MutationErrorsToMessagesType
}

export const useImporter = ({
    columns,
    maxTableLength,
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
    const intl = useIntl()
    const TooManyRowsErrorMessage = intl.formatMessage({ id: 'TooManyRowsInTable' }, {
        value: maxTableLength,
    })
    const InvalidHeadersErrorMessage = intl.formatMessage({ id: 'TableHasInvalidHeaders' }, {
        value: columns.map(column => `"${column.name}"`).join(', '),
    })
    const NotValidRowTypesMessage = intl.formatMessage({ id:'errors.import.InvalidColumnTypes' })
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    const [isImported, setIsImported] = useState(false)
    const importer = useRef(null)
    const errors: ImporterErrorMessages = {
        tooManyRows: TooManyRowsErrorMessage,
        invalidColumns: InvalidHeadersErrorMessage,
        invalidTypes: NotValidRowTypesMessage,
    }

    const importData = useCallback((data) => {
        importer.current = null
        // reset hook state
        setIsImported(false)
        setError(null)
        setProgress(0)
        setTotalRows(Math.max(0, data.length - 1))

        importer.current = new Importer(columns, rowNormalizer, rowValidator, objectCreator, errors, mutationErrorsToMessages, SLEEP_INTERVAL_BEFORE_QUERIES, maxTableLength)
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