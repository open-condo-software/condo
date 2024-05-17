import { message, Upload } from 'antd'
import isNil from 'lodash/isNil'
import React from 'react'
import XLSX from 'xlsx'

import { useIntl } from '@open-condo/next/intl'

import { TABLE_UPLOAD_ACCEPT_FILES } from '@condo/domains/common/constants/fileExtensions'

import {
    IMeterDataImporterProps,
    ImportDataType,
    TOnMetersUpload,
} from './MetersDataImporterTypes'

/**
 * Mutates argument
 * @param data
 */
function normalizeRowsShape (data: unknown[][]) {
    const rowLength = Math.max.apply(null, data.map((x) => x.length))
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < rowLength; j++) {
            data[i][j] = (isNil(data[i][j]) || data[i][j] === '') ? null : String(data[i][j])
        }
    }
}

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
        action: (file) => {
            const reader = new FileReader()
            const isCsv = /\.(csv|txt)$/.test(file.name)

            if (isCsv) {// For now csv|txt means sbbol
                reader.onload = (event) => {
                    const textDecoder = new TextDecoder()
                    const uint8 = new Uint8Array(event.target.result as ArrayBuffer)
                    const csv = String(textDecoder.decode(uint8)).trim()
                        .split('\n')
                        .filter(row => !row.trim().startsWith('#'))
                        .map(row => row.split(';'))

                    onUpload(ImportDataType.sbbol, csv)
                }
            } else {
                reader.onload = (e) => {
                    const readData = e.target.result
                    const wb = XLSX.read(readData, { type: 'array', cellDates: true })
                    const wsName = wb.SheetNames[0]
                    const sheetData = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wsName], { header: 1 })
                        .filter((x) => x.length) // filter out empty rows

                    normalizeRowsShape(sheetData)

                    onUpload(ImportDataType.doma, sheetData)
                }
            }

            reader.onerror = () => {
                message.error(UploadErrorMessage)
            }

            reader.readAsArrayBuffer(file)

            return ''
        },
        customRequest: () => undefined,
        showUploadList: false,
        maxCount: 1,
    }), [UploadErrorMessage, UploadSuccessMessage, onUpload])
}

const FILE_EXTENSIONS = TABLE_UPLOAD_ACCEPT_FILES.map(function (x) {
    return '.' + x
}).join(',')

export const MetersDataImporter: React.FC<IMeterDataImporterProps> = (props) => {
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
