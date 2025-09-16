import { Divider, Form, notification } from 'antd'
import React, { CSSProperties, useCallback, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { RefreshCw } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Input, Space, Typography, Modal } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { useSecretContext } from '@/domains/miniapp/components/OIDC/edit/SecretProvider'
import  { PROD_REDIRECT_URI_EXAMPLE, DEV_REDIRECT_URI_EXAMPLE } from '@/domains/miniapp/constants/common'
import { INVALID_URL, HTTPS_ONLY } from '@dev-portal-api/domains/miniapp/constants/errors'
import { OIDC_SECRET_LENGTH } from '@dev-portal-api/domains/miniapp/constants/oidc'

import styles from './EditClientForm.module.css'

import {
    AppEnvironment,
    GetOidcClientQuery,
    useUpdateOidcClientUrlMutation,
    UpdateOidcClientUrlMutation,
    useGenerateOidcClientSecretMutation,
    GenerateOidcClientSecretMutation,
} from '@/gql'


const MASKED_PASSWORD = '*'.repeat(OIDC_SECRET_LENGTH)
const CREDENTIALS_DIVIDER_STYLES: CSSProperties = { marginBottom: 24 }
const SETTINGS_DIVIDER_STYLES: CSSProperties = { marginTop: 24, marginBottom: 24 }
const EDIT_CLIENT_FORM_ERRORS_TO_FIELDS_MAP = {
    [INVALID_URL]: 'redirectUri',
    [HTTPS_ONLY]: 'redirectUri',
}

type EditClientFormProps = {
    id: string
    environment: AppEnvironment
    client: NonNullable<GetOidcClientQuery['client']>
}

type EditOIDCClientFormValues = {
    redirectUri: string
}

export const EditClientForm: React.FC<EditClientFormProps> = ({ id, environment, client }) => {
    const intl = useIntl()
    const CredentialsLabel = intl.formatMessage({ id:'apps.b2c.sections.oidc.clientSettings.editClientForm.subsection.credentials.label' })
    const SettingsLabel = intl.formatMessage({ id:'apps.b2c.sections.oidc.clientSettings.editClientForm.subsection.settings.label' })
    const ClientIDLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.items.clientId.label' })
    const ClientSecretLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.items.clientSecret.label' })
    const RedirectURILabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.items.redirectURI.label' })
    const RegenerateSecretLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.actions.regenerateSecret' })
    const SaveLabel = intl.formatMessage({ id: 'global.actions.save' })
    const SuccessUpdateMessage = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.notifications.successUpdate.title' })
    const CancelLabel = intl.formatMessage({ id: 'global.actions.cancel' })
    const ConfirmLabel = intl.formatMessage({ id: 'global.actions.confirm' })
    const ModalTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.modal.title' })
    const ModalText = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.modal.text' })
    const SuccessGenerationTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.notifications.successGeneration.title' })
    const SuccessGenerationMessage = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.notifications.successGeneration.description' })

    const [modalOpen, setModalOpen] = useState(false)
    const openModal = useCallback(() => setModalOpen(true), [])
    const closeModal = useCallback(() => setModalOpen(false), [])

    const { secret, setSecret } = useSecretContext()
    const { urlValidator, requiredFieldValidator } = useValidations()

    const [form] = Form.useForm()

    useEffect(() => {
        if (form) {
            form.setFieldValue('clientSecret', secret || MASKED_PASSWORD)
        }
    }, [form, secret])

    const onUpdateError = useMutationErrorHandler({
        form,
        typeToFieldMapping: EDIT_CLIENT_FORM_ERRORS_TO_FIELDS_MAP,
    })
    const onUpdateCompleted = useCallback((data: UpdateOidcClientUrlMutation) => {
        notification.success({ message: SuccessUpdateMessage })
        if (form) {
            form.setFieldValue('redirectUri', data.client?.redirectUri)
        }
    }, [SuccessUpdateMessage, form])
    const [updateUrlMutation] = useUpdateOidcClientUrlMutation({
        onError: onUpdateError,
        onCompleted: onUpdateCompleted,
    })
    const updateClientUrl = useCallback((values: EditOIDCClientFormValues) => {
        updateUrlMutation({
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
    }, [environment, id, updateUrlMutation])

    const onGenerateError = useMutationErrorHandler()
    const onGenerateCompleted = useCallback((data: GenerateOidcClientSecretMutation) => {
        notification.success({ message: SuccessGenerationTitle, description: SuccessGenerationMessage })
        setSecret(data.client?.clientSecret || null)
        closeModal()
    }, [SuccessGenerationMessage, SuccessGenerationTitle, closeModal, setSecret])
    const [generateSecretMutation] = useGenerateOidcClientSecretMutation({
        onError: onGenerateError,
        onCompleted:onGenerateCompleted,
    })
    const generateSecret = useCallback(() => {
        generateSecretMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    environment,
                    app: { id },
                },
            },
        })
    }, [environment, generateSecretMutation, id])

    return (
        <>
            <Form
                name='edit-oidc-client'
                layout='vertical'
                form={form}
                initialValues={{
                    clientId: client.clientId,
                    redirectUri: client.redirectUri,
                }}
                onFinish={updateClientUrl}
                requiredMark={false}
            >
                <Divider orientation='left' orientationMargin={0} style={CREDENTIALS_DIVIDER_STYLES}>
                    <Typography.Title level={4}>
                        {CredentialsLabel}
                    </Typography.Title>
                </Divider>
                <Form.Item
                    name='clientId'
                    label={ClientIDLabel}
                >
                    <Input readOnly/>
                </Form.Item>
                <div>
                    <Form.Item
                        name='clientSecret'
                        label={ClientSecretLabel}
                        className={styles.passwordItem}
                    >
                        <Input.Password
                            readOnly
                            visibilityToggle={{ visible: Boolean(secret) }}
                            disabled={!secret}
                        />
                    </Form.Item>
                    <Typography.Link onClick={openModal}>
                        <Space size={4} direction='horizontal'>
                            <RefreshCw size='small'/>
                            {RegenerateSecretLabel}
                        </Space>
                    </Typography.Link>
                </div>
                <Divider orientation='left' orientationMargin={0} style={SETTINGS_DIVIDER_STYLES}>
                    <Typography.Title level={4}>
                        {SettingsLabel}
                    </Typography.Title>
                </Divider>
                <Form.Item
                    name='redirectUri'
                    label={RedirectURILabel}
                    rules={[requiredFieldValidator, urlValidator]}
                    className={styles.lastFormItem}
                >
                    <Input
                        placeholder={
                            environment === AppEnvironment.Production
                                ? PROD_REDIRECT_URI_EXAMPLE
                                : DEV_REDIRECT_URI_EXAMPLE
                        }
                    />
                </Form.Item>
                <Button type='primary' onClick={form.submit}>
                    {SaveLabel}
                </Button>
            </Form>
            {modalOpen && (
                <Modal
                    title={ModalTitle}
                    onCancel={closeModal}
                    open={modalOpen}
                    footer={[
                        <Button type='secondary' key='cancel' onClick={closeModal}>
                            {CancelLabel}
                        </Button>,
                        <Button type='primary' key='confirm' onClick={generateSecret}>
                            {ConfirmLabel}
                        </Button>,
                    ]}
                >
                    <Typography.Paragraph type='secondary'>
                        {ModalText}
                    </Typography.Paragraph>
                </Modal>
            )}
        </>
    )
}