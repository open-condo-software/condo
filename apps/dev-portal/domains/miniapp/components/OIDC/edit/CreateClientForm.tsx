import { Form, notification } from 'antd'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button, Input, Modal } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { EmptySubSectionView } from '@/domains/miniapp/components/EmptySubSectionView'

import styles from './CreateClientForm.module.css'
import { useSecretContext } from './SecretProvider'


import { AppEnvironment, useCreateOidcClientMutation, GetOidccLientDocument } from '@/lib/gql'

// TODO: Replace with relative link after migrating docs
const DOCS_LINK = 'https://docs.google.com/document/d/1pTMq0Qi9307uUIfHK4eGi6T1xtUvrK4Asz9j5Eoo8bI/edit#heading=h.tyzk29z45ac'
const DEV_REDIRECT_URI_EXAMPLE = 'https://miniapp.dev.example.com/oidc/callback'
const PROD_REDIRECT_URI_EXAMPLE = 'https://miniapp.example.com/oidc/callback'

type CreateClientFormProps = {
    id: string
    environment: AppEnvironment
}

type CreateOIDCClientFormValues = {
    redirectUri: string
}

export const CreateClientForm: React.FC<CreateClientFormProps> = ({ id, environment }) => {
    const intl = useIntl()
    const NoClientMessage = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.createClientForm.emptyView.message' })
    const NoClientDescription = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.createClientForm.emptyView.description' })
    const CreateClientLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.createClientForm.emptyView.actions.create' })
    const AboutOIDCLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.createClientForm.emptyView.actions.details' })
    const CreateModalTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.createClientForm.modal.title' })
    const RedirectURILabel = intl.formatMessage({ id:'apps.b2c.sections.oidc.clientSettings.createClientForm.modal.form.items.redirectUri.label' })
    const RedirectURIHintText = intl.formatMessage({ id:'apps.b2c.sections.oidc.clientSettings.createClientForm.modal.form.items.redirectUri.hint' })
    const SuccessNotificationTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.createClientForm.modal.form.notifications.success.title' })
    const SuccessNotificationDescription = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.createClientForm.modal.form.notifications.success.description' })

    const [form] = Form.useForm()
    const { requiredFieldValidator, urlValidator } = useValidations()

    const [createModalOpen, setCreateModalOpen] = useState(false)
    const openModal = useCallback(() => {
        setCreateModalOpen(true)
    }, [])
    const closeModal = useCallback(() => {
        form.resetFields()
        setCreateModalOpen(false)
    }, [form])

    const { setSecret } = useSecretContext()

    const onError = useMutationErrorHandler()
    const [createOIDCClientMutation] = useCreateOidcClientMutation({
        onError,
        onCompleted: (data) => {
            setSecret(data.client?.clientSecret || null)
            notification.success({ message: SuccessNotificationTitle, description: SuccessNotificationDescription, duration: 20 })
            closeModal()
        },
        refetchQueries: [
            {
                query: GetOidccLientDocument,
                variables: {
                    data: {
                        environment,
                        app: { id },
                    },
                },
            },
        ],
    })

    const createOIDCClient = useCallback((values: CreateOIDCClientFormValues) => {
        createOIDCClientMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    redirectUri: values.redirectUri,
                    app: { id },
                    environment,
                },
            },
        })
    }, [createOIDCClientMutation, id, environment])


    return (
        <>
            <EmptySubSectionView
                dino='searching'
                title={NoClientMessage}
                description={NoClientDescription}
                actions={[
                    <Button
                        key='primary-action'
                        type='primary'
                        onClick={openModal}
                    >
                        {CreateClientLabel}
                    </Button>,
                    <Button
                        key='secondary-action'
                        type='secondary'
                        href={DOCS_LINK}
                        target='_blank'
                    >
                        {AboutOIDCLabel}
                    </Button>,
                ]}
            />
            {createModalOpen && (
                <Modal
                    open={createModalOpen}
                    onCancel={closeModal}
                    title={CreateModalTitle}
                    footer={
                        <Button type='primary' onClick={form.submit}>
                            {CreateClientLabel}
                        </Button>
                    }
                >
                    <Form
                        name='create-oidc-client'
                        layout='vertical'
                        requiredMark={false}
                        form={form}
                        onFinish={createOIDCClient}
                    >
                        <Form.Item
                            className={styles.lastFormItem}
                            name='redirectUri'
                            requiredMark={false}
                            rules={[requiredFieldValidator, urlValidator]}
                            label={RedirectURILabel}
                            tooltip={RedirectURIHintText}
                        >
                            <Input
                                placeholder={environment === AppEnvironment.Production ? PROD_REDIRECT_URI_EXAMPLE : DEV_REDIRECT_URI_EXAMPLE}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </>
    )
}