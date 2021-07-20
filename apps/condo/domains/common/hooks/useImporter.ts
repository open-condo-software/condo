import { useCallback, useRef, useState } from 'react'
import { Importer } from '@condo/domains/common/utils/Importer'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useImporter = (columns, rowNormalizer, rowValidator, objectCreator, onFinish, onError) => {
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
        importer.current.import(data)
    }, [])

    const breakImport = () => {
        if (importer) {
            importer.current.break()
        }
    }

    return [importData, progress, error, isImported, breakImport]
}