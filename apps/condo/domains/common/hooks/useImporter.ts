import { useCallback, useMemo, useRef, useState } from 'react'
import {
    Importer,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    Columns,
    ProcessedRow, MAX_TABLE_LENGTH, RowValidationErrorType,
} from '@condo/domains/common/utils/importer'
import { useIntl } from '../../../../../packages/@core.next/intl'

type useImporterParams = {
    columns: Columns,
    rowNormalizer: RowNormalizer,
    rowValidator: RowValidator,
    objectCreator: ObjectCreator,
    setTotalRows: (number) => void,
    setSuccessRows: () => void,
    handleRowError: (row: ProcessedRow) => void,
    onFinish: () => void,
    onError: () => void,
}

export const useImporter = ({ columns, handleRowError, objectCreator, onError, onFinish, rowNormalizer, rowValidator, setSuccessRows, setTotalRows }: useImporterParams) => {
    const intl = useIntl()
    const ImportDefaultErrorMessage = intl.formatMessage({ id: 'ImportError' })
    const TooManyRowsErrorMessage = intl.formatMessage({ id: 'meter.import.error.TooManyRowsInTable' }, {
        count: MAX_TABLE_LENGTH,
    })
    const InvalidHeadersErrorMessage = intl.formatMessage({ id: 'common.import.error.TableHasInvalidHeaders' }, {
        value: columns.map(column => `"${column.name}"`).join(', '),
    })

    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    const [isImported, setIsImported] = useState(false)
    const importer = useRef(null)

    const defaultErrorsMap = useMemo(() => ({
        [RowValidationErrorType.TooManyRows]: TooManyRowsErrorMessage,
        [RowValidationErrorType.InvalidColumns]: InvalidHeadersErrorMessage,
    }), [TooManyRowsErrorMessage, InvalidHeadersErrorMessage])

    const importData = useCallback((data) => {
        importer.current = null
        // reset hook state
        setIsImported(false)
        setError(null)
        setProgress(0)
        setTotalRows(Math.max(0, data.length - 1))

        importer.current = new Importer(columns, rowNormalizer, rowValidator, objectCreator)
        importer.current.onProgressUpdate(setProgress)
        importer.current.onError((e) => {
            importer.current = null
            e.message = defaultErrorsMap[e.type] || ImportDefaultErrorMessage
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

    return [importData, progress, error, isImported, breakImport] as const
}