import { File } from '@app/condo/schema'
import { message, Upload } from 'antd'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { TABLE_UPLOAD_ACCEPT_FILES } from '@condo/domains/common/constants/fileExtensions'

import {
    IMeterDataImporterProps,
    TOnMetersUpload,
} from './MetersDataImporterTypes'


const useUploadConfig = (onUpload: TOnMetersUpload) => {
    const intl = useIntl()

    const UploadSuccessMessage = intl.formatMessage({ id: 'errors.fileUploadSuccess' })
    const UploadErrorMessage = intl.formatMessage({ id: 'errors.fileUploadError' })

    return React.useMemo(() => ({
        handleUpload: (info) => {
            if (info.file.status === 'done') {
                message.success(UploadSuccessMessage)
            } else if (info.file.status === 'error') {
                message.error(UploadErrorMessage)
            }
        },
        customRequest: async (options: UploadRequestOption) => {
            onUpload(options.file as File)
        },
        showUploadList: false,
        maxCount: 1,
    }), [UploadErrorMessage, UploadSuccessMessage, onUpload])
}

const FILE_EXTENSIONS = TABLE_UPLOAD_ACCEPT_FILES.map(function (x) {
    return '.' + x
}).join(',')

export const MetersDataImporter: React.FC<React.PropsWithChildren<IMeterDataImporterProps>> = (props) => {
    const uploadConfig = useUploadConfig(props.onUpload)

    return (
        <Upload
            data-cy='data-importer--upload'
            {...uploadConfig}
            accept={FILE_EXTENSIONS}
        >
            {props.children}
        </Upload>
    )
}
