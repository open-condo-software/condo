import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Modal } from '@open-condo/ui'


type SubscriptionRemoveModalProps = {
    open: boolean
    onCancel: () => void
    /** Names of the features being removed */
    names: ReadonlyArray<string>
    planName: string
    loading: boolean
    onConfirm: () => void
}

export const SubscriptionRemoveModal: React.FC<SubscriptionRemoveModalProps> = ({
    open,
    onCancel,
    names,
    planName,
    loading,
    onConfirm,
}) => {
    const intl = useIntl()
    const ConfirmMessage = intl.formatMessage({ id: 'subscription.remove.confirm' })

    const isSingle = names.length === 1
    const title = isSingle
        ? intl.formatMessage({ id: 'subscription.remove.title.one' }, { name: names[0] })
        : intl.formatMessage(
            { id: 'subscription.remove.title' },
            { count: names.length, names: intl.formatList(names.map(name => `«${name}»`), { type: 'conjunction' }) }
        )

    const info = intl.formatMessage(
        { id: isSingle ? 'subscription.remove.info.one' : 'subscription.remove.info' },
        { planName }
    )

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={title}
            footer={
                <Button
                    id='subscription-remove-confirm-button'
                    type='primary'
                    danger
                    onClick={onConfirm}
                    loading={loading}
                >
                    {ConfirmMessage}
                </Button>
            }
        >
            <Alert type='info' showIcon description={info} />
        </Modal>
    )
}
