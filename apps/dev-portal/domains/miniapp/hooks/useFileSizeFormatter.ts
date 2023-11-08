import { useCallback } from 'react'
import { useIntl } from 'react-intl'

type FormatterType = (sizeInBytes: number) => string
export function useFileSizeFormatter (): FormatterType {
    const intl = useIntl()

    return useCallback((sizeInBytes) => {
        const isSizeInMb = sizeInBytes >= 1024 * 1024
        const unitLabel = intl.formatMessage({ id: isSizeInMb ? 'global.units.mb' : 'global.units.kb' })
        const sizeInUnits = Math.ceil(isSizeInMb ? sizeInBytes / 1024 / 1024 : sizeInBytes / 1024)
        return `${sizeInUnits}${unitLabel}`
    }, [intl])
}