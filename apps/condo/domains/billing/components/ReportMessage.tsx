import { useIntl } from '@condo/next/intl'
import { useMemo } from 'react'
import { Typography } from 'antd'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import React from 'react'

type LastReportType = {
    totalReceipts: number
    finishTime: string
}

interface IReportMessageProps {
    lastReport: LastReportType
}

export const ReportMessage: React.FC<IReportMessageProps> = ({ lastReport }) => {
    const intl = useIntl()
    return useMemo(() => {
        const DataWasUploadedSuffixMessage = intl.formatMessage({ id: 'DataWasUploadedOnSuffix' })
        const DataWasUploadedPrefixMessage = intl.formatMessage({ id: 'DataWasUploadedOnPrefix' })
        const NoReportMessage = intl.formatMessage({ id: 'NoReceiptsLoaded' })
        if (!lastReport) {
            return (
                <Typography.Text type='warning'>
                    {NoReportMessage}
                </Typography.Text>
            )
        }
        const thousands = lastReport.totalReceipts >= 1000
        const TotalReportsMessage = intl.formatMessage({ id: 'RecordsLoaded' }, { count: lastReport.totalReceipts })
        const ReportsMessage = thousands
            ? intl.formatMessage({ id: 'ThousandsRecordsLoaded' }, { count: Math.floor(lastReport.totalReceipts / 1000) })
            : TotalReportsMessage
        const ReportDateMessage = intl.formatDate(lastReport.finishTime, { day:'numeric', month:'long', year: 'numeric'  })
        const ReportTimeMessage = intl.formatDate(lastReport.finishTime, { hour: 'numeric', minute: 'numeric' })
        const uploadMessage = `${DataWasUploadedPrefixMessage} ${ReportDateMessage}${DataWasUploadedSuffixMessage} ${ReportTimeMessage}`
        return (
            <>
                <Typography.Text type='warning'>
                    {uploadMessage}
                </Typography.Text>
                &nbsp;
                <Typography.Text>
                    &#40;
                    {
                        thousands
                            ? (
                                <Tooltip title={TotalReportsMessage}>
                                    {ReportsMessage}
                                </Tooltip>
                            ) : (TotalReportsMessage)
                    }
                    &#41;
                </Typography.Text>
            </>
        )
    }, [intl, lastReport])
}