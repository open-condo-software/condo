import { notification } from 'antd'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { EmptySubSectionView } from '@/domains/miniapp/components/EmptySubSectionView'

import { useSecretContext } from './SecretContextProvider'

import { useCreateOidcClientMutation, GetOidcClientInfoDocument, CreateOidcClientMutation } from '@/lib/gql'

// TODO: Replace with relative link after migrating docs
const DOCS_LINK = 'https://docs.google.com/document/d/1pTMq0Qi9307uUIfHK4eGi6T1xtUvrK4Asz9j5Eoo8bI/edit#heading=h.tyzk29z45ac'

export const CreateClientForm: React.FC<{ appId: string }> = ({ appId }) => {
    const intl = useIntl()
    const SubSectionTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.emptyView.title' })
    const NoClientTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.emptyView.message' })
    const NoClientDescription = intl.formatMessage({ id: 'apps.b2c.sections.oidc.emptyView.description' })
    const DetailsButtonLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.emptyView.actions.details' })
    const CreateButtonLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.emptyView.actions.create' })
    const SuccessNotificationTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.emptyView.actions.create.notifications.success.title' })
    const SuccessNotificationDescription = intl.formatMessage({ id: 'apps.b2c.sections.oidc.emptyView.actions.create.notifications.success.description' })

    const { setSecret } = useSecretContext()
    const onError = useMutationErrorHandler()
    const onCompleted = useCallback((data: CreateOidcClientMutation) => {
        setSecret(data.client?.clientSecret || null)
        notification.success({ message: SuccessNotificationTitle, description: SuccessNotificationDescription, duration: 20 })
    }, [setSecret, SuccessNotificationTitle, SuccessNotificationDescription])

    const [createOIDCClientMutation] = useCreateOidcClientMutation({
        onCompleted,
        onError,
        refetchQueries: [{ query: GetOidcClientInfoDocument, variables: { where: { b2cApp: { id: appId } } } }],
    })

    const createOIDCClient = useCallback(() => {
        createOIDCClientMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    b2cApp: { connect: { id: appId } },
                },
            },
        })
    }, [createOIDCClientMutation, appId])

    return (
        <Section>
            <SubSection title={SubSectionTitle}>
                <EmptySubSectionView
                    dino='searching'
                    title={NoClientTitle}
                    description={NoClientDescription}
                    actions={[
                        <Button
                            key='primary'
                            type='primary'
                            onClick={createOIDCClient}
                        >
                            {CreateButtonLabel}
                        </Button>,
                        <Button
                            key='secondary'
                            type='secondary'
                            href={DOCS_LINK}
                            target='_blank'
                        >
                            {DetailsButtonLabel}
                        </Button>,
                    ]}
                />
            </SubSection>
        </Section>
    )
}