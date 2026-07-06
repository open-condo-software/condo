import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@open-condo/ui'

import { EmptySubSectionView } from '@/domains/miniapp/components/EmptySubSectionView'
import { ChangeClientModal } from '@/domains/miniapp/components/OIDC/edit/ChangeClientModal'
import { OIDC_DOCS_LINK } from '@/domains/miniapp/constants/common'

import { AppEnvironment } from '@/gql'



type AddClientFormProps = {
    id: string
    environment: AppEnvironment
}

export const AddClientForm: React.FC<AddClientFormProps> = ({ id, environment }) => {
    const intl = useIntl()
    const NoClientMessage = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.emptyView.message' })
    const NoClientDescription = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.emptyView.description' })
    const AddClientLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.emptyView.actions.add' })
    const AboutOIDCLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.emptyView.actions.details' })
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const openModal = useCallback(() => {
        setCreateModalOpen(true)
    }, [])
    const closeModal = useCallback(() => {
        setCreateModalOpen(false)
    }, [])



    return (
        <>
            <EmptySubSectionView
                image='/mascot/searching.webp'
                title={NoClientMessage}
                description={NoClientDescription}
                actions={[
                    <Button
                        key='primary-action'
                        type='primary'
                        onClick={openModal}
                    >
                        {AddClientLabel}
                    </Button>,
                    <Button
                        key='secondary-action'
                        type='secondary'
                        href={OIDC_DOCS_LINK}
                        target='_blank'
                    >
                        {AboutOIDCLabel}
                    </Button>,
                ]}
            />
            {createModalOpen && (
                <ChangeClientModal
                    environment={environment}
                    appId={id}
                    open={createModalOpen}
                    source='emptyView'
                    onCancel={closeModal}
                />
            )}
        </>
    )
}