import styled from '@emotion/styled'
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
    value: number | string | Date
}

type OnUpload = (
    data: {
        cols: Array<UploadCols>,
        data: Array<Array<UploadDataItem>>,
    }
) => void

const BASE_DATE = new Date(1899, 11, 30, 0, 0, 0)
const DNTHRESH = BASE_DATE.getTime() + (new Date().getTimezoneOffset() - BASE_DATE.getTimezoneOffset()) * 60000

const DAY_MS = 24 * 60 * 60 * 1000
const DAYS_1462_MS = 1462 * DAY_MS

function datenum (date, isDate1904) {
    let epoch = date.getTime()
    if (isDate1904) {
        epoch -= DAYS_1462_MS
    }
    return (epoch - DNTHRESH) / DAY_MS
}

function fixImportedDate (date, isDate1904) {
    // Convert JS Date back to Excel date code and parse them using SSF module.
    const parsed = XLSX.SSF.parse_date_code(datenum(date, false), { date1904: isDate1904 })
    return new Date(parsed.y, parsed.m, parsed.d, parsed.H, parsed.M, parsed.S)
}

// https://bugs.chromium.org/p/v8/issues/detail?id=7863 - V8 (JavaScript engine) has issue with Date.getTimezoneOffset
// https://github.com/SheetJS/sheetjs/issues/1565#issuecomment-548491331 - Description and solution to the problem
const fixDateV8 = (table: Array<Array<{ value: any }>>, isDate1904: boolean) => {
    return table.map((row) => row.map((cell) => {
        return {
            ...cell,
            ...(cell.value instanceof Date ? { value: fixImportedDate(cell.value, isDate1904) } : undefined),
        }
    }))
}

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

                const isDate1904 = wb.Workbook.WBProps.date1904
                const fixedData = fixDateV8(data, isDate1904)

                onUpload({ cols, data: fixedData })
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
    onUpload: OnUpload,
}

const FILE_EXTENSIONS = TABLE_UPLOAD_ACCEPT_FILES.map(function (x) {
    return '.' + x
}).join(',')

const StyledUpload = styled(Upload)`
  .ant-upload {
    width: 100%;
    
    & > .condo-btn {
      width: 100%; 
    }
  }
`

export const DataImporter: React.FC<IDataImporterProps> = (props) => {
    const uploadConfig = useUploadConfig(props.onUpload)

    return (
        <StyledUpload
            data-cy='data-importer--upload'
            {...uploadConfig}
            accept={FILE_EXTENSIONS}
        >
            {props.children}
        </StyledUpload>
    )
}