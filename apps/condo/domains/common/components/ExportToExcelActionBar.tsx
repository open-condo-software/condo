import { DatabaseFilled } from '@ant-design/icons'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useLazyQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Form, notification } from 'antd'
import { DocumentNode } from 'graphql'
import { get } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'

interface IExportToExcelActionBarProps {
    hidden?: boolean
    sortBy: string | string[]
    searchObjectsQuery: string
    exportToExcelQuery: DocumentNode
    useTimeZone?: boolean
    disabled?: boolean
}

export const ExportToExcelActionBar: React.FC<IExportToExcelActionBarProps> = (props) => {
    const { searchObjectsQuery, sortBy, exportToExcelQuery, hidden = false, useTimeZone = true, disabled = false } = props

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
                const message = get(error, ['graphQLErrors', 0, 'extensions', 'messageForUser']) || error.message
                notification.error({ message })
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        },
    )

    useEffect(() => {
        setDownloadLink(null)
    }, [searchObjectsQuery, sortBy, exportToExcelQuery, timeZone])

    const variablesData = {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where: searchObjectsQuery,
        sortBy: sortBy,
        timeZone: undefined,
    }
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
                            type={'sberBlack'}
                            secondary
                            icon={<DatabaseFilled/>}
                            loading={isXlsLoading}
                            onClick={handleExportToExcel}
                            disabled={disabled}
                        >
                            {ExportAsExcelLabel}
                        </Button>
                }
            </ActionBar>
        </Form.Item>
    )
}