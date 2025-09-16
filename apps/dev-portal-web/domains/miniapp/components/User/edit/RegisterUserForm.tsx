import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@open-condo/ui'

import { EmptySubSectionView } from '@/domains/miniapp/components/EmptySubSectionView'

import { RegisterUserModal } from './RegisterUserModal'

import { AppEnvironment } from '@/gql'

type RegisterUserFormProps = {
    id: string
    environment: AppEnvironment
}

export const RegisterUserForm: React.FC<RegisterUserFormProps> = ({ id, environment }) => {
    const intl = useIntl()
    const NoUserMessage = intl.formatMessage({ id: 'apps.id.sections.serviceUser.userSettings.registerUserForm.emptyView.message' })
    const NoUserDescription = intl.formatMessage({ id: 'apps.id.sections.serviceUser.userSettings.registerUserForm.emptyView.description' })
    const RegisterUserActionLabel = intl.formatMessage({ id: 'apps.id.sections.serviceUser.userSettings.registerUserForm.emptyView.actions.register' })

    const [registerUserModalOpen, setRegisterUserModalOpen] = useState(false)

    const openRegisterModal = useCallback(() => {
        setRegisterUserModalOpen(true)
    }, [])
    const closeRegisterModal = useCallback(() => {
        setRegisterUserModalOpen(false)
    }, [])


    return (
        <>
            <EmptySubSectionView
                dino='searching'
                title={NoUserMessage}
                description={NoUserDescription}
                actions={[
                    <Button
                        key='primary-action'
                        type='primary'
                        onClick={openRegisterModal}
                    >
                        {RegisterUserActionLabel}
                    </Button>,
                ]}
            />
            {registerUserModalOpen && (
                <RegisterUserModal
                    id={id}
                    environment={environment}
                    open={registerUserModalOpen}
                    onClose={closeRegisterModal}
                />
            )}
        </>
    )
}