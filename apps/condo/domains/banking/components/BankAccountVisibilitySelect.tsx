import { BankAccountReport as BankAccountReportType } from '@app/condo/schema'
import find from 'lodash/find'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import { useRouter } from 'next/router'
import React, { useCallback, useState, useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Select, Typography } from '@open-condo/ui'

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

const transformVisibilityValue = (value: BankAccountReportType['publishedAt']) => Number(!isNull(value))

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
    const [isReportVisible, setIsReportVisible] = useState<BankAccountVisibility>(transformVisibilityValue(accountVisibility))

    const updateBankAccountReport = BankAccountReport.useUpdate({}, (result) => {
        setIsReportVisible(transformVisibilityValue(result.publishedAt))
        refetch()
        setIsUpdating(false)
    })

    useEffect(() => {
        setIsReportVisible(transformVisibilityValue(accountVisibility))
    }, [accountVisibility])

    const handleChange = useCallback((value) => {
        if (selectedBankAccount) {
            setIsUpdating(true)

            const publishedAt = isReportVisible === BankAccountVisibility.hidden
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
    }, [intl, updateBankAccountReport, selectedBankAccount, OperationCompletedTitle, ReportVisibleDescription, ReportHiddenDescription, isReportVisible])

    if (isEmpty(bankAccountReports)) {
        return null
    }

    return (
        <Select
            value={isReportVisible}
            onChange={handleChange}
            disabled={isUpdating}
            type={isReportVisible ? 'success' : 'danger'}
            options={[
                {
                    value: BankAccountVisibility.visible,
                    label: ReportVisibleTitle,
                    textType: 'success',
                    hidden: !!isReportVisible,
                },
                {
                    value: BankAccountVisibility.hidden,
                    label: ReportHiddenTitle,
                    textType: 'danger',
                    hidden: !isReportVisible,
                },
            ]}
        />
    )
}

const MemoizedComponent = React.memo(BankAccountVisibilitySelect)

export {
    MemoizedComponent as BankAccountVisibilitySelect,
}
