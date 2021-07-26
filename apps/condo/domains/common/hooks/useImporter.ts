import { useCallback, useRef, useState } from 'react'
import {
    Importer,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    ColumnInfo,
} from '@condo/domains/common/utils/importer'


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useImporter = (columns: Array<ColumnInfo>,
    rowNormalizer: RowNormalizer,
    rowValidator: RowValidator,
    objectCreator: ObjectCreator,
    setTotalRows: (number) => void,
    setSuccessRows: (number?) => void,
    onFinish: () => void,
    onError: () => void) => {
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    const [isImported, setIsImported] = useState(false)
    const importer = useRef(null)

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
        importer.current.import(data)
    }, [])

    const breakImport = () => {
        if (importer) {
            importer.current.break()
        }
    }

    return [importData, progress, error, isImported, breakImport]
}