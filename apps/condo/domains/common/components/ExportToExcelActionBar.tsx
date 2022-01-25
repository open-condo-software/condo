import { DatabaseFilled } from '@ant-design/icons'
import { useLazyQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Form, notification } from 'antd'
import { DocumentNode } from 'graphql'
import React, { useCallback, useEffect, useState } from 'react'
import ActionBar from './ActionBar'
import { Button } from './Button'

interface IExportToExcelActionBarProps {
    hidden?: boolean
    sortBy: string
    searchObjectsQuery: string
    exportToExcelQuery: DocumentNode
    useTimeZone?: boolean
}

export const ExportToExcelActionBar: React.FC<IExportToExcelActionBarProps> = (props) => {
    const { searchObjectsQuery, sortBy, exportToExcelQuery, hidden = false, useTimeZone = true } = props

    const intl = useIntl()
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.ticket.id.DownloadExcelLabel' })
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })

    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const [downloadLink, setDownloadLink] = useState(null)

    const [
        exportToExcel,
        { loading: isXlsLoading },
    ] = useLazyQuery(
        exportToExcelQuery,
        {
            onError: error => {
                notification.error(error)
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        },
    )

    useEffect(() => {
        setDownloadLink(null)
    }, [searchObjectsQuery, sortBy, exportToExcelQuery, timeZone])

    const variablesData = { where: searchObjectsQuery, sortBy: sortBy, timeZone: undefined }
    const deps = [exportToExcel, searchObjectsQuery, sortBy]

    if (useTimeZone) {
        variablesData.timeZone = timeZone
        deps.push(timeZone)
    }

    const handleExportToExcel = useCallback(() => {
        exportToExcel({ variables: { data: variablesData } })
    }, deps)

    return (
        <Form.Item noStyle>
            <ActionBar hidden={hidden}>
                {
                    downloadLink
                        ?
                        <Button
                            type={'inlineLink'}
                            icon={<DatabaseFilled/>}
                            loading={isXlsLoading}
                            target="_blank"
                            href={downloadLink}
                            rel="noreferrer"
                        >
                            {DownloadExcelLabel}
                        </Button>
                        :
                        <Button
                            type={'sberPrimary'}
                            secondary
                            icon={<DatabaseFilled/>}
                            loading={isXlsLoading}
                            onClick={handleExportToExcel}
                        >
                            {ExportAsExcelLabel}
                        </Button>
                }
            </ActionBar>
        </Form.Item>
    )
}