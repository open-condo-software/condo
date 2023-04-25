import { BankAccountReport as BankAccountReportType } from '@app/condo/schema'
import find from 'lodash/find'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { useRouter } from 'next/router'
import React, { useCallback, useState, useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Select, Option, Typography } from '@open-condo/ui'

import { BankAccountReport } from '@condo/domains/banking/utils/clientSchema'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'

enum BankAccountVisibility {
    'hidden',
    'visible',
}

interface IBankAccountVisibilitySelect {
    ({ bankAccountReports, refetch }: {
        bankAccountReports: Array<BankAccountReportType>,
        refetch: () => void
    }): React.ReactElement
}

const BankAccountVisibilitySelect: IBankAccountVisibilitySelect = ({ bankAccountReports, refetch }) => {
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
    const [reportVisible, setReportVisible] = useState<BankAccountVisibility>(Number(!isNull(accountVisibility)))

    const updateBankAccountReport = BankAccountReport.useUpdate({}, (result) => {
        setReportVisible(Number(!isNull(result.publishedAt)))
        refetch()
        setIsUpdating(false)
    })

    useEffect(() => {
        setReportVisible(Number(!isNull(accountVisibility)))
    }, [accountVisibility])

    const handleChange = useCallback((value) => {
        if (selectedBankAccount) {
            setIsUpdating(true)

            const publishedAt = reportVisible === BankAccountVisibility.hidden
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
    }, [intl, updateBankAccountReport, selectedBankAccount, OperationCompletedTitle, ReportVisibleDescription, ReportHiddenDescription, reportVisible])

    if (!bankAccountReports) {
        return null
    }

    return (
        <Select
            value={reportVisible}
            onChange={handleChange}
            disabled={isUpdating}
            type={reportVisible ? 'success' : 'danger'}
        >
            <Option value={BankAccountVisibility.visible} hidden={reportVisible}>
                <Typography.Text type='success'>
                    {ReportVisibleTitle}
                </Typography.Text>
            </Option>
            <Option value={BankAccountVisibility.hidden} hidden={!reportVisible}>
                <Typography.Text type='danger'>
                    {ReportHiddenTitle}
                </Typography.Text>
            </Option>
        </Select>
    )
}

const MemoizedComponent = React.memo(BankAccountVisibilitySelect)

export {
    MemoizedComponent as BankAccountVisibilitySelect,
}
