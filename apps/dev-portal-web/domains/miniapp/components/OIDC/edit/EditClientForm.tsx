import { Form, notification } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { RefreshCw } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Input, Space, Typography, Modal, Alert } from '@open-condo/ui'

import { CopyableInput } from '@/domains/common/components/CopyableInput'
import { SubDivider } from '@/domains/common/components/SubDivider'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { ChangeClientModal } from '@/domains/miniapp/components/OIDC/edit/ChangeClientModal'
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
    GenerateOidcClientSecretMutation, OidcClientInfoFragment,
} from '@/gql'


const MASKED_PASSWORD = '*'.repeat(OIDC_SECRET_LENGTH)
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
    const CredentialsLabel = intl.formatMessage({ id:'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.subsection.credentials.label' })
    const SettingsLabel = intl.formatMessage({ id:'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.subsection.settings.label' })
    const ClientIDLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.items.clientId.label' })
    const ClientSecretLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.items.clientSecret.label' })
    const RedirectURILabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.items.redirectURI.label' })
    const RegenerateSecretLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.actions.regenerateSecret' })
    const ChangeClientLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.actions.change' })
    const SaveLabel = intl.formatMessage({ id: 'global.actions.save' })
    const SuccessUpdateMessage = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.notifications.successUpdate.title' })
    const CancelLabel = intl.formatMessage({ id: 'global.actions.cancel' })
    const ConfirmLabel = intl.formatMessage({ id: 'global.actions.confirm' })
    const ModalTitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.modal.title' })
    const ModalText = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.modal.text' })
    const SuccessGenerationTitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.notifications.successGeneration.title' })
    const SuccessGenerationMessage = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.notifications.successGeneration.description' })
    const NotEnabledClientAlertTitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.notEnabledClientAlert.title' })
    const NotEnabledClientPublishLink = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.notEnabledClientAlert.publishLink.text' })

    const router = useRouter()
    // /apps/b2c/[id] -> ['', 'apps', 'b2c', '[id]'] -> ['apps', 'b2c', '[id]']
    const appType = router.pathname.split('/').filter(Boolean)[1]

    const NotEnabledClientAlertDescription = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.editClientForm.notEnabledClientAlert.description' }, {
        publishLink: <Typography.Link component={Link} href={`/apps/${appType}/${id}?section=publishing`}>{NotEnabledClientPublishLink}</Typography.Link>,
    })

    const [clientModalOpen, setClientModalOpen] = useState(false)
    const [secretModalOpen, setSecretModalOpen] = useState(false)
    const openClientModal = useCallback(() => setClientModalOpen(true), [])
    const closeClientModal = useCallback(() => setClientModalOpen(false), [])
    const openSecretModal = useCallback(() => setSecretModalOpen(true), [])
    const closeSecretModal = useCallback(() => setSecretModalOpen(false), [])

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
                    oidcClientId: client.id,
                },
            },
        })
    }, [client.id, environment, id, updateUrlMutation])

    const onGenerateError = useMutationErrorHandler()
    const onGenerateCompleted = useCallback((data: GenerateOidcClientSecretMutation) => {
        notification.success({ message: SuccessGenerationTitle, description: SuccessGenerationMessage })
        setSecret(data.client?.clientSecret || null)
        closeSecretModal()
    }, [SuccessGenerationMessage, SuccessGenerationTitle, closeSecretModal, setSecret])
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
                    oidcClientId: client.id,
                },
            },
        })
    }, [client.id, environment, generateSecretMutation, id])

    const onClientChange = useCallback((data: Pick<OidcClientInfoFragment, 'clientId' | 'redirectUri'>) => {
        form.setFieldValue('clientId', data.clientId)
        form.setFieldValue('redirectUri', data.redirectUri)
    }, [form])

    return (
        <>
            <Form
                name='update-oidc-client-form'
                layout='vertical'
                form={form}
                initialValues={{
                    clientId: client.clientId,
                    redirectUri: client.redirectUri,
                }}
                onFinish={updateClientUrl}
                requiredMark={false}
            >
                <SubDivider title={CredentialsLabel}/>
                <div className={styles.itemWithActionContainer}>
                    <Form.Item
                        name='clientId'
                        label={ClientIDLabel}
                        className={styles.itemWithAction}
                    >
                        <CopyableInput/>
                    </Form.Item>
                    <Typography.Link onClick={openClientModal}>
                        <Space size={4} direction='horizontal'>
                            <RefreshCw size='small'/>
                            {ChangeClientLabel}
                        </Space>
                    </Typography.Link>
                </div>
                <div>
                    <Form.Item
                        name='clientSecret'
                        label={ClientSecretLabel}
                        className={styles.itemWithAction}
                    >
                        <Input.Password
                            readOnly
                            visibilityToggle={{ visible: Boolean(secret) }}
                            disabled={!secret}
                        />
                    </Form.Item>
                    <Typography.Link onClick={openSecretModal}>
                        <Space size={4} direction='horizontal'>
                            <RefreshCw size='small'/>
                            {RegenerateSecretLabel}
                        </Space>
                    </Typography.Link>
                </div>
                {!client.isEnabled && (
                    <div className={styles.notEnabledClientAlertContainer}>
                        <Alert
                            type='error'
                            showIcon
                            message={NotEnabledClientAlertTitle}
                            description={NotEnabledClientAlertDescription}
                        />
                    </div>
                )}
                <SubDivider title={SettingsLabel}/>
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
            {clientModalOpen && (
                <ChangeClientModal
                    environment={environment}
                    appId={id}
                    onCancel={closeClientModal}
                    open={clientModalOpen}
                    source='editClientForm'
                    onChange={onClientChange}
                />
            )}
            {secretModalOpen && (
                <Modal
                    title={ModalTitle}
                    onCancel={closeSecretModal}
                    open={secretModalOpen}
                    footer={[
                        <Button type='secondary' key='cancel' onClick={closeSecretModal}>
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