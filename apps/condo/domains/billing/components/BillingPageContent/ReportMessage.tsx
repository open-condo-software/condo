import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Tooltip } from '@open-condo/ui'

import { useBillingAndAcquiringContexts } from './ContextProvider'

export const ReportMessage: React.FC = () => {
    const intl = useIntl()
    const { billingContext } = useBillingAndAcquiringContexts()
    const lastReport = get(billingContext, 'lastReport', {})

    return useMemo(() => {
        if (typeof lastReport.totalReceipts !== 'number' || typeof lastReport.finishTime !== 'string') {
            return null
        }

        const DataWasUploadedSuffixMessage = intl.formatMessage({ id: 'dataWasUploadedOnSuffix' })
        const DataWasUploadedPrefixMessage = intl.formatMessage({ id: 'dataWasUploadedOnPrefix' })
        const NoReportMessage = intl.formatMessage({ id: 'noReceiptsLoaded' })
        if (!lastReport) {
            return (
                <Typography.Text type='warning'>
                    {NoReportMessage}
                </Typography.Text>
            )
        }
        const thousands = lastReport.totalReceipts >= 1000
        const TotalReportsMessage = intl.formatMessage({ id: 'recordsLoaded' }, { count: lastReport.totalReceipts })
        const ReportsMessage = thousands
            ? intl.formatMessage({ id: 'thousandsRecordsLoaded' }, { count: Math.floor(lastReport.totalReceipts / 1000) })
            : TotalReportsMessage
        const ReportDateMessage = intl.formatDate(lastReport.finishTime, { day:'numeric', month:'long', year: 'numeric'  })
        const ReportTimeMessage = intl.formatDate(lastReport.finishTime, { hour: 'numeric', minute: 'numeric' })
        const uploadMessage = `${DataWasUploadedPrefixMessage} ${ReportDateMessage}${DataWasUploadedSuffixMessage} ${ReportTimeMessage}`
        return (
            <>
                <Typography.Text type='warning' size='medium'>
                    {uploadMessage}
                </Typography.Text>
                &nbsp;
                <Typography.Text size='medium'>
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