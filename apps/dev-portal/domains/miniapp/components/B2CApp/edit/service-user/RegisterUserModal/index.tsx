import React, { useState } from 'react'
import { useIntl } from 'react-intl'

import { Modal } from '@open-condo/ui'
import type { ModalProps } from '@open-condo/ui'

import { EmailInputStep } from './EmailInputStep'

import { AppEnvironment } from '@/lib/gql'

type RegisterUserModalProps = Pick<ModalProps, 'onCancel' | 'open'> & {
    id: string
    environment: AppEnvironment
}

export const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ onCancel, open, id, environment }) => {
    const intl = useIntl()
    const ModalTitle = intl.formatMessage({ id: 'apps.b2c.sections.serviceUser.userSettings.registerUserForm.modal.title' })

    const [confirmAction, setConfirmAction] = useState<null>(null)

    let modalContent: React.ReactNode

    if (!confirmAction) {
        modalContent = <EmailInputStep/>
    }

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={ModalTitle}
        >
            {modalContent}
        </Modal>
    )
}