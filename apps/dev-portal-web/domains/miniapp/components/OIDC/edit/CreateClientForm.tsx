import { Form, notification } from 'antd'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Input, Modal } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { EmptySubSectionView } from '@/domains/miniapp/components/EmptySubSectionView'
import { DEV_REDIRECT_URI_EXAMPLE, PROD_REDIRECT_URI_EXAMPLE, OIDC_DOCS_LINK } from '@/domains/miniapp/constants/common'

import styles from './CreateClientForm.module.css'
import { useSecretContext } from './SecretProvider'


import { AppEnvironment, useCreateOidcClientMutation, GetOidcClientDocument, CreateOidcClientMutation } from '@/lib/gql'



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
    const onCompleted = useCallback((data: CreateOidcClientMutation) => {
        setSecret(data.client?.clientSecret || null)
        notification.success({ message: SuccessNotificationTitle, description: SuccessNotificationDescription, duration: 20 })
        closeModal()
    }, [SuccessNotificationDescription, SuccessNotificationTitle, closeModal, setSecret])
    const [createOIDCClientMutation] = useCreateOidcClientMutation({
        onError,
        onCompleted,
        refetchQueries: [
            {
                query: GetOidcClientDocument,
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
                        href={OIDC_DOCS_LINK}
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