import { Upload, message } from 'antd'
import React from 'react'
import XLSX from 'xlsx'

import { useIntl } from '@open-condo/next/intl'

import { TABLE_UPLOAD_ACCEPT_FILES } from '../constants/fileExtensions'
import { makeAntdCols, makeAntdData } from '../utils/excel.utils'

type UploadCols = {
    title: string
    key: number
    dataIndex: number
}

type UploadDataItem = {
    value: number | string
}

type OnUpload = (
    data: {
        cols: Array<UploadCols>
        data: Array<Array<UploadDataItem>>
    }
) => void

const useUploadConfig = (onUpload: OnUpload) => {
    const intl = useIntl()

    const UploadSuccessMessage = intl.formatMessage({ id: 'errors.fileUploadSuccess' })
    const UploadErrorMessage = intl.formatMessage({ id: 'errors.fileUploadError' })

    const config = {
        handleUpload: (info) => {
            if (info.file.status === 'done') {
                message.success(UploadSuccessMessage)
            } else if (info.file.status === 'error') {
                message.error(UploadErrorMessage)
            }
        },
        action: (file) => {
            const reader = new FileReader()
            const rABS = !!reader.readAsBinaryString

            reader.onload = (e) => {
                const bstr = e.target.result
                const wb = XLSX.read(bstr, {
                    type: rABS ? 'binary' : 'array',
                    cellDates: true,
                })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const cols = makeAntdCols(ws['!ref'])
                const data = makeAntdData(ws)

                onUpload({ cols, data })
            }

            reader.onerror = () => {
                message.error(UploadErrorMessage)
            }

            if (rABS) {
                reader.readAsBinaryString(file)
            } else {
                reader.readAsArrayBuffer(file)
            }

            return ''
        },
        customRequest: () => undefined,
        showUploadList: false,
        maxCount: 1,
    }

    return React.useMemo(() => config, [])
}

interface IDataImporterProps {
    onUpload: OnUpload
}

const FILE_EXTENSIONS = TABLE_UPLOAD_ACCEPT_FILES.map(function (x) {
    return '.' + x
}).join(',')

export const DataImporter: React.FC<React.PropsWithChildren<IDataImporterProps>> = (props) => {
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