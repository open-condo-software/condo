import { B2BAppContextStatusType } from '@app/condo/schema'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Modal, Typography } from '@open-condo/ui'


type ConnectModalProps = {
    miniappHasFrame: boolean
    miniappHasIcon: boolean
    contextStatus?: B2BAppContextStatusType
    open: boolean
    closeModal: () => void
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
    contextStatus,
    miniappHasFrame,
    open,
    closeModal,
    miniappHasIcon,
}) => {
    const intl = useIntl()

    if (!contextStatus || contextStatus === B2BAppContextStatusType.Error || (contextStatus === B2BAppContextStatusType.Finished && !miniappHasFrame)) {
        return null
    }

    const postfix = contextStatus === B2BAppContextStatusType.Finished && miniappHasIcon ? '.withIcon' : ''

    const ModalTitle = intl.formatMessage({ id: `miniapp.connectModal.${contextStatus}${postfix}.title` as FormatjsIntl.Message['ids'] })
    const ModalMessage = intl.formatMessage({ id: `miniapp.connectModal.${contextStatus}${postfix}.message` as FormatjsIntl.Message['ids'] })

    return (
        <Modal
            title={ModalTitle}
            open={open}
            onCancel={closeModal}
            destroyOnClose
        >
            <Typography.Text type='secondary'>
                {ModalMessage}
            </Typography.Text>
        </Modal>
    )
}