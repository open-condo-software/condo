import { useState } from 'react'
import { Form, notification } from 'antd'
import { DatabaseFilled } from '@ant-design/icons'

import { useLazyQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'

import ActionBar from './ActionBar'
import { Button } from './Button'

export const ExportToExcelActionBar = (
    { searchObjectsQuery, sortBy, exportToExcelQuery }
) => {
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

    return (
        <Form.Item noStyle>
            <ActionBar>
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
                            onClick={
                                () => exportToExcel({ variables: { data: { where: searchObjectsQuery, sortBy: sortBy, timeZone } } })
                            }>
                            {ExportAsExcelLabel}
                        </Button>
                }
            </ActionBar>
        </Form.Item>
    )
}