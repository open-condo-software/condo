import { notification, Upload } from 'antd'
import { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { useFileSizeFormatter } from '@/domains/miniapp/hooks/useFileSizeFormatter'

import type { RcFile } from 'antd/lib/upload/interface'

type ValidatorType = (file: RcFile) => Promise<boolean | string>
type FileValidatorOpts = {
    restrictMimeTypes?: Array<string>
    sizeLimit?: number
    dimensionsLimit?: {
        max?: { width: number, height: number }
        min?: { width: number, height: number }
    }
}

export function useFileValidator (opts: FileValidatorOpts): ValidatorType {
    const intl = useIntl()
    const ErrorTitle = intl.formatMessage({ id: 'global.errors.fileUpload.title' })
    const fileSizeFormatter = useFileSizeFormatter()

    return useCallback((file: RcFile) => {
        return new Promise((resolve) => {
            if (opts.restrictMimeTypes && !opts.restrictMimeTypes.includes(file.type)) {
                const ErrorDescription = intl.formatMessage({ id: 'global.errors.fileUpload.wrongType.description' })
                notification.error({ message: ErrorTitle, description: ErrorDescription })
                return resolve(Upload.LIST_IGNORE)
            }
            if (opts.sizeLimit && file.size > opts.sizeLimit) {
                const formattedLimit = fileSizeFormatter(opts.sizeLimit)
                const ErrorDescription = intl.formatMessage({ id: 'global.errors.fileUpload.tooLarge.description' }, {
                    limit: formattedLimit,
                })
                notification.error({ message: ErrorTitle, description: ErrorDescription })
                return resolve(Upload.LIST_IGNORE)
            }
            if (opts.dimensionsLimit) {
                const reader = new FileReader()
                reader.addEventListener('load', (event) => {
                    const _loadedImageUrl = event.target?.result
                    const image = new Image()
                    image.src = _loadedImageUrl as string
                    image.addEventListener('load', () => {
                        const { width, height } = image
                        if (opts.dimensionsLimit?.max && (width > opts.dimensionsLimit.max.width || height > opts.dimensionsLimit.max.height)) {
                            const ErrorDescription = intl.formatMessage({ id: 'global.errors.imageUpload.tooBig.description' }, {
                                maxSize: `${opts.dimensionsLimit.max.width}×${opts.dimensionsLimit.max.height}`,
                            })
                            notification.error({ message: ErrorTitle, description: ErrorDescription })
                            return resolve(Upload.LIST_IGNORE)
                        }
                        if (opts.dimensionsLimit?.min && (width < opts.dimensionsLimit.min.width || height < opts.dimensionsLimit.min.height)) {
                            const ErrorDescription = intl.formatMessage({ id: 'global.errors.imageUpload.tooSmall.description' }, {
                                minSize: `${opts.dimensionsLimit.min.width}×${opts.dimensionsLimit.min.height}`,
                            })
                            notification.error({ message: ErrorTitle, description: ErrorDescription })
                            return resolve(Upload.LIST_IGNORE)
                        }
                        return resolve(false)
                    })
                })
                reader.readAsDataURL(file)
            } else {
                resolve(false)
            }
        })
    }, [ErrorTitle, opts, intl, fileSizeFormatter])
}