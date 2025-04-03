import get from 'lodash/get'
import React, { useEffect, useMemo } from 'react'

import bridge from '@open-condo/bridge'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Tooltip } from '@open-condo/ui'

import { useBillingAndAcquiringContexts } from './ContextProvider'

export const ReportMessage: React.FC = () => {
    const intl = useIntl()
    const { billingContexts, refetchBilling } = useBillingAndAcquiringContexts()
    const lastReport = get(billingContexts.find(({ lastReport }) => !!lastReport), 'lastReport', {})

    useEffect(() => {
        const handleRedirect = async (event) => {
            if (get(event, 'type') === 'condo-bridge') refetchBilling()
        }
        bridge.subscribe(handleRedirect)
        return () => {
            bridge.unsubscribe(handleRedirect)
        }
    }, [refetchBilling])

    return useMemo(() => {
        if (typeof lastReport.totalReceipts !== 'number' || typeof lastReport.finishTime !== 'string') {
            return null
        }

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