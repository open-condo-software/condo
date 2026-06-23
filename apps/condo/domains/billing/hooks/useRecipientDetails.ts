import { BillingRecipient as BillingRecipientType } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ListProps } from '@open-condo/ui'


export const useRecipientDetails = (recipient: BillingRecipientType): ListProps['dataSource'] => {
    const intl = useIntl()
    const AccountLabel = intl.formatMessage({ id: 'global.bankAccount' })
    const BICLabel = intl.formatMessage({ id: 'pages.condo.settings.bankAccountInfo.bic' })
    const TINLabel = intl.formatMessage({ id: 'global.tin' })
    const CategoryLabel = intl.formatMessage({ id: 'field.Category' })
    const FeeLabel = intl.formatMessage({ id: 'Fee' })
    const NoDataMessage = intl.formatMessage({ id: 'NoData' })

    return useMemo(() => {
        const dataSource: ListProps['dataSource'] = [
            {
                label: AccountLabel,
                value: recipient.bankAccount || NoDataMessage,
            },
            {
                label: BICLabel,
                value: recipient.bic || NoDataMessage,
            },
            {
                label: TINLabel,
                value: recipient.tin || NoDataMessage,
            },
            {
                label: CategoryLabel,
                value: recipient.category?.name || NoDataMessage,
            },
            {
                label: FeeLabel,
                value: recipient.commission || NoDataMessage,
            },
        ]

        return dataSource
    }, [AccountLabel, BICLabel, CategoryLabel, FeeLabel, NoDataMessage, TINLabel, recipient])
}
