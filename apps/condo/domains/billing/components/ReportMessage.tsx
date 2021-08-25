import { useIntl } from '@core/next/intl'
import { useMemo } from 'react'
import { Typography } from 'antd'
import { colors } from '@condo/domains/common/constants/style'
import React from 'react'

interface IReportMessageProps {
    totalRows: number
    finishTime: string
}

export const ReportMessage: React.FC<IReportMessageProps> = ({ totalRows, finishTime }) => {
    const intl = useIntl()
    const DataWasUploadedSuffixMessage = intl.formatMessage({ id: 'DataWasUploadedOnSuffix' })
    const DataWasUploadedPrefixMessage = intl.formatMessage({ id: 'DataWasUploadedOnPrefix' })
    const TotalReportsMessage = totalRows >= 1000
        ? intl.formatMessage({ id: 'ThousandsRecordsLoaded' }, { count: Math.floor(totalRows / 1000) })
        : intl.formatMessage({ id: 'RecordsLoaded' }, { count: totalRows })
    const ReportDateMessage = intl.formatDate(finishTime, { day:'numeric', month:'long', year: 'numeric'  })
    const ReportTimeMessage = intl.formatDate(finishTime, { hour: 'numeric', minute: 'numeric' })
    return useMemo(() => {
        const uploadMessage = `${DataWasUploadedPrefixMessage} ${ReportDateMessage}${DataWasUploadedSuffixMessage} ${ReportTimeMessage}`
        const rowsMessage = `(${TotalReportsMessage})`
        return (
            <>
                <Typography.Text style={{ color: colors.orange[5] }}>
                    {uploadMessage}
                </Typography.Text>
                &nbsp;
                <Typography.Text>
                    {rowsMessage}
                </Typography.Text>
            </>
        )
    }, [DataWasUploadedSuffixMessage, DataWasUploadedPrefixMessage, TotalReportsMessage, ReportDateMessage, ReportTimeMessage])
}