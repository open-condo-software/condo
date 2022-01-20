import React, { useCallback, useState } from 'react'
import { DocumentNode } from 'graphql'
import { Form, notification } from 'antd'
import { DatabaseFilled } from '@ant-design/icons'

import { useLazyQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'

import ActionBar from './ActionBar'
import { Button } from './Button'

interface IExportToExcelActionBarProps {
    hidden?: boolean
    sortBy: string
    searchObjectsQuery: string
    exportToExcelQuery: DocumentNode
}

export const ExportToExcelActionBar: React.FC<IExportToExcelActionBarProps> = (props) => {
    const { searchObjectsQuery, sortBy, exportToExcelQuery, hidden = false } = props

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

    const handleExportToExcel = useCallback(() => {
        exportToExcel({ variables: { data: { where: searchObjectsQuery, sortBy: sortBy, timeZone } } })
    }, [exportToExcel, searchObjectsQuery, sortBy, timeZone])

    return (
        <Form.Item noStyle>
            <ActionBar hidden={hidden}>
                {
                    downloadLink
                        ?
                        <Button
                            type={'inlineLink'}
                            icon={<DatabaseFilled />}
                            loading={isXlsLoading}
                            target='_blank'
                            href={downloadLink}
                            rel='noreferrer'
                        >
                            {DownloadExcelLabel}
                        </Button>
                        :
                        <Button
                            type={'sberPrimary'}
                            secondary
                            icon={<DatabaseFilled />}
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