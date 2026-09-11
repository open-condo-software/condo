import dayjs from 'dayjs'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Modal } from '@open-condo/ui'

import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'


type SubscriptionRemoveModalProps = {
    open: boolean
    onCancel: () => void
    rows: ReadonlyArray<CatalogRow>
    planName: string
    /** Last day the features stay usable, they are not revoked immediately */
    paidUntil: string | null
    loading: boolean
    onConfirm: () => void
}

export const SubscriptionRemoveModal: React.FC<SubscriptionRemoveModalProps> = ({
    open,
    onCancel,
    rows,
    planName,
    paidUntil,
    loading,
    onConfirm,
}) => {
    const intl = useIntl()
    const ConfirmMessage = intl.formatMessage({ id: 'subscription.remove.confirm' })

    const names = rows.map(row => row.label.toLowerCase()).join(', ')
    const title = intl.formatMessage({ id: 'subscription.remove.title' }, { count: rows.length, names })
    const formattedDate = paidUntil ? dayjs(paidUntil).format('D MMMM YYYY') : ''

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={title}
            footer={
                <Button
                    id='subscription-remove-confirm-button'
                    type='secondary'
                    danger
                    onClick={onConfirm}
                    loading={loading}
                >
                    {ConfirmMessage}
                </Button>
            }
        >
            <Alert
                type='info'
                showIcon
                description={intl.formatMessage(
                    { id: 'subscription.remove.info' },
                    { date: formattedDate, planName }
                )}
            />
        </Modal>
    )
}
