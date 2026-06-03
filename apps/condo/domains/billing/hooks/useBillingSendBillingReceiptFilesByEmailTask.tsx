import {
    User as UserType,
    Organization,
    BillingSendBillingReceiptFilesTaskCreateInput,
} from '@app/condo/schema'
import React, { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'

import { useBillingSendBillingReceiptFilesTaskUIInterface } from './useBillingSendBillingReceiptFilesTaskUIInterface'

type UseBillingSendBillingReceiptFilesByEmailTaskProps = {
    user: UserType
    organization: Organization
    period: string
    receiptIds?: string[]
    label?: string
}

type SendButtonProps = {
    disabled?: boolean
    id?: string
}

type UseBillingSendBillingReceiptFilesByEmailTaskReturnType = {
    SendButton: React.FC<SendButtonProps>
}

export const useBillingSendBillingReceiptFilesByEmailTask = (props: UseBillingSendBillingReceiptFilesByEmailTaskProps): UseBillingSendBillingReceiptFilesByEmailTaskReturnType => {
    const intl = useIntl()
    const SendLabel = intl.formatMessage({ id: 'pages.billing.SendBillingReceiptsToEmail.button' })

    const { user, period, receiptIds, label, organization } = props

    const { BillingSendBillingReceiptFilesTask: TaskUIInterface } = useBillingSendBillingReceiptFilesTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher<BillingSendBillingReceiptFilesTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        period,
        receiptIds: receiptIds || [],
        user: { connect: { id: user?.id } },
        organization: { connect: { id: organization?.id } },
    })

    const handleClick = useCallback(() => handleRunTask(), [handleRunTask])

    const SendButton: React.FC<SendButtonProps> = useCallback(({ disabled = false, id = 'sendBillingReceiptFilesToEmail' }) => (
        <Button
            id={id}
            type='secondary'
            disabled={loading || disabled}
            loading={loading}
            children={label || SendLabel}
            onClick={handleClick}
        />
    ), [SendLabel, handleClick, label, loading])

    return { SendButton }
}
