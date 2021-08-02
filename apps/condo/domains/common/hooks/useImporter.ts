import { useCallback, useRef, useState } from 'react'
import {
    Importer,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    Columns,
    ProcessedRow,
    ImporterErrorMessages,
    MAX_TABLE_LENGTH,
} from '@condo/domains/common/utils/importer'
import { useIntl } from '@core/next/intl'


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useImporter = (columns: Columns,
    rowNormalizer: RowNormalizer,
    rowValidator: RowValidator,
    objectCreator: ObjectCreator,
    setTotalRows: (number) => void,
    setSuccessRows: () => void,
    handleRowError: (row: ProcessedRow) => void,
    onFinish: () => void,
    onError: () => void) => {
    const intl = useIntl()
    const TooManyRowsErrorMessage = intl.formatMessage({ id: 'TooManyRowsInTable' }, {
        value: MAX_TABLE_LENGTH,
    })
    const InvalidRowsErrorMessage = intl.formatMessage({ id: 'TableHasInvalidHeaders' }, {
        value: columns.map(column => `"${column.name}"`).join(', '),
    })
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    const [isImported, setIsImported] = useState(false)
    const importer = useRef(null)
    const errors: ImporterErrorMessages = {
        tooManyRows: TooManyRowsErrorMessage,
        invalidColumns: InvalidRowsErrorMessage,
    }

    const importData = useCallback((data) => {
        importer.current = null
        // reset hook state
        setIsImported(false)
        setError(null)
        setProgress(0)
        setTotalRows(Math.max(0, data.length - 1))

        importer.current = new Importer(columns, rowNormalizer, rowValidator, objectCreator, errors)
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