import { BankAccountReport as BankAccountReportType } from '@app/condo/schema'
import find from 'lodash/find'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { useRouter } from 'next/router'
import React, { useCallback, useRef, useState, useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Select, Option, Typography } from '@open-condo/ui'

import { BankAccountReport } from '@condo/domains/banking/utils/clientSchema'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'

enum BankAccountVisibility {
    'hidden',
    'visible',
}

interface IBankAccountVisibilitySelect {
    ({ bankAccountReports }: { bankAccountReports: Array<BankAccountReportType> }): React.ReactElement
}

export const BankAccountVisibilitySelect: IBankAccountVisibilitySelect = ({ bankAccountReports }) => {
    const intl = useIntl()
    const ReportVisibleTitle = intl.formatMessage({ id: 'pages.condo.property.report.visibility.visible' })
    const ReportHiddenTitle = intl.formatMessage({ id: 'pages.condo.property.report.visibility.hidden' })
    const ReportVisibleDescription = intl.formatMessage({ id: 'pages.condo.property.report.visibility.visible.description' })
    const ReportHiddenDescription = intl.formatMessage({ id: 'pages.condo.property.report.visibility.hidden.description' })
    const OperationCompletedTitle = intl.formatMessage({ id: 'OperationCompleted' })

    const { query } = useRouter()

    const selectedBankAccount = find(bankAccountReports, { period: get(query, 'period') })

    const accountVisibility = get(selectedBankAccount, 'publishedAt', null)

    const [isUpdating, setIsUpdating] = useState(false)
    const reportVisibleRef = useRef<BankAccountVisibility>(Number(!isNull(accountVisibility)))

    const updateBankAccountReport = BankAccountReport.useUpdate({}, (result) => {
        reportVisibleRef.current = Number(!isNull(result.publishedAt))
        setIsUpdating(false)
    })

    useEffect(() => {
        reportVisibleRef.current = Number(!isNull(accountVisibility))
    }, [accountVisibility])

    const handleChange = useCallback((value) => {
        if (selectedBankAccount) {
            setIsUpdating(true)

            const publishedAt = reportVisibleRef.current === BankAccountVisibility.hidden
                ? new Date().toISOString()
                : null

            runMutation({
                action: () => updateBankAccountReport({ publishedAt }, selectedBankAccount as BankAccountReportType),
                intl,
                OnCompletedMsg: () => ({
                    message: <Typography.Text strong>{OperationCompletedTitle}</Typography.Text>,
                    description: <Typography.Text type='secondary'>
                        {value ? ReportVisibleDescription : ReportHiddenDescription}
                    </Typography.Text>,
                }),
            })
        }
    }, [intl, updateBankAccountReport, selectedBankAccount, OperationCompletedTitle, ReportVisibleDescription, ReportHiddenDescription])

    return (
        <Select
            value={reportVisibleRef.current}
            onChange={handleChange}
            disabled={isUpdating}
            type={reportVisibleRef.current ? 'success' : 'danger'}
        >
            <Option value={BankAccountVisibility.visible} hidden={reportVisibleRef.current}>
                <Typography.Text type='success'>
                    {ReportVisibleTitle}
                </Typography.Text>
            </Option>
            <Option value={BankAccountVisibility.hidden} hidden={!reportVisibleRef.current}>
                <Typography.Text type='danger'>
                    {ReportHiddenTitle}
                </Typography.Text>
            </Option>
        </Select>
    )
}
