import { BankAccount as BankAccountType } from '@app/condo/schema'
import React, { useCallback, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Select, Option, Typography } from '@open-condo/ui'

import { BankAccount } from '@condo/domains/banking/utils/clientSchema'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'

enum BankAccountVisibility {
    'hidden',
    'visible',
}

interface IBankAccountVisibilitySelect {
    ({ bankAccount }: { bankAccount: BankAccountType }): React.ReactElement
}

export const BankAccountVisibilitySelect: IBankAccountVisibilitySelect = ({ bankAccount }) => {
    const intl = useIntl()
    const ReportVisibleTitle = intl.formatMessage({ id: 'pages.condo.property.report.visibility.visible' })
    const ReportHiddenTitle = intl.formatMessage({ id: 'pages.condo.property.report.visibility.hidden' })
    const ReportVisibleDescription = intl.formatMessage({ id: 'pages.condo.property.report.visibility.visible.description' })
    const ReportHiddenDescription = intl.formatMessage({ id: 'pages.condo.property.report.visibility.hidden.description' })
    const OperationCompletedTitle = intl.formatMessage({ id: 'OperationCompleted' })

    const [isUpdating, setIsUpdating] = useState(false)
    const reportVisibleRef = useRef<BankAccountVisibility>(Number(bankAccount.reportVisible))

    const updateBankAccount = BankAccount.useUpdate({}, (result) => {
        reportVisibleRef.current = Number(result.reportVisible)
        setIsUpdating(false)
    })

    const handleChange = useCallback((value) => {
        setIsUpdating(true)

        runMutation({
            action: () => updateBankAccount({ reportVisible: Boolean(value) }, bankAccount),
            intl,
            OnCompletedMsg: () => ({
                message: <Typography.Text strong>{OperationCompletedTitle}</Typography.Text>,
                description: <Typography.Text type='secondary'>
                    {value ? ReportVisibleDescription : ReportHiddenDescription}
                </Typography.Text>,
            }),
        })
    }, [intl, updateBankAccount, bankAccount, OperationCompletedTitle, ReportVisibleDescription, ReportHiddenDescription])

    return (
        <Select
            placeholder=''
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
