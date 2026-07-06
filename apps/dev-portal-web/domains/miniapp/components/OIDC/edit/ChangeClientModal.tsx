import { Form, notification } from 'antd'
import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { useIntl } from 'react-intl'

import { Plus } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Radio, Modal, Typography, Space, Button, Card, Input } from '@open-condo/ui'
import type { RadioProps } from '@open-condo/ui'

import { Spin } from '@/domains/common/components/Spin'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { useSecretContext } from '@/domains/miniapp/components/OIDC/edit/SecretProvider'
import { DEV_REDIRECT_URI_EXAMPLE, PROD_REDIRECT_URI_EXAMPLE } from '@/domains/miniapp/constants/common'

import styles from './ChangeClientModal.module.css'

import type { FormInstance, RadioChangeEvent } from 'antd'

import {
    AppEnvironment,
    CreateOidcClientMutation,
    ChangeOidcClientMutation,
    GetOidcClientDocument,
    OidcClientInfoFragment,
    useCreateOidcClientMutation,
    useGetAllOidcClientsQuery,
    useChangeOidcClientMutation,
} from '@/gql'

type FormStep = 'select' | 'create'

type ChangeClientModalProps = {
    environment: AppEnvironment
    appId: string
    open: boolean
    source: 'emptyView' | 'editClientForm'
    onCancel: () => void
    onChange?: (client: Pick<OidcClientInfoFragment, 'id' | 'clientId' | 'redirectUri'>) => void
}

type SelectClientFormValues = {
    oidcClientId?: string
}

type SelectClientFormProps = {
    clients: Array<OidcClientInfoFragment>
    isCreateAvailable: boolean
    onChange: (value: string) => void
    form: FormInstance
    onFinish: (values: SelectClientFormValues) => void
}

type CreateClientFormProps = {
    environment: AppEnvironment
    form: FormInstance
    onFinish: (values: CreateClientFormValues) => void
}

type CreateClientFormValues = {
    redirectUri: string
}

type CardBoxProps = Pick<RadioProps, 'value' | 'checked' | 'onChange' | 'label'> & {
    currentValue?: string
}

type CardBoxGroupProps = {
    value?: string
    onChange?: (e: RadioChangeEvent) => void
    isCreateAvailable: boolean
    items: Array<OidcClientInfoFragment>
}

const OIDCClientCheckboxLabel: React.FC<Pick<OidcClientInfoFragment, 'clientId' | 'name'>> = ({ clientId, name }) => {
    const intl = useIntl()
    const UnnamedClientText = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.items.client.name.placeholder' })
    const ClientIdLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.items.client.clientId.label' })

    return (
        <div className={styles.checkboxLabel}>
            <Typography.Title level={4} ellipsis>{name || UnnamedClientText}</Typography.Title>
            <Typography.Paragraph size='medium' ellipsis><Typography.Text size='medium' type='secondary'>{ClientIdLabel}: </Typography.Text>{clientId}</Typography.Paragraph>
        </div>
    )
}

const CardBox: React.FC<CardBoxProps> = ({ value, onChange, label, currentValue }) => {
    const checked = currentValue === value

    const handleClick = useCallback(() => {
        if (!checked && onChange) {
            onChange({ target: { value } } as RadioChangeEvent)
        }
    }, [checked, onChange, value])

    return (
        <Card active={checked} hoverable onClick={handleClick} bodyPadding='12px 16px' className={styles.cardBox}>
            <Radio value={value} checked={checked} label={label}/>
        </Card>
    )
}

const CardBoxGroup: React.FC<CardBoxGroupProps> = ({ value, onChange, isCreateAvailable, items }) => {
    const intl = useIntl()
    const CreateLabelText = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.items.client.create.text' })

    const CreateLabel = useMemo(() => {
        return (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size='medium'/>
                <Typography.Title level={4} ellipsis>{CreateLabelText}</Typography.Title>
            </span>
        )
    }, [CreateLabelText])

    return (
        <Radio.Group value={value} onChange={onChange} className={styles.cardBoxGroup}>
            {items.map(item => (
                <CardBox
                    key={item.id}
                    value={item.id}
                    label={<OIDCClientCheckboxLabel clientId={item.clientId} name={item.name} />}
                    currentValue={value}
                    onChange={onChange}
                />
            ))}
            {isCreateAvailable && (
                <CardBox
                    value='create'
                    label={CreateLabel}
                    currentValue={value}
                    onChange={onChange}
                />
            )}
        </Radio.Group>
    )
}

const SelectClientForm: React.FC<SelectClientFormProps> = ({ isCreateAvailable, clients, onChange, form, onFinish }) => {
    const oidcClientId: string | undefined = Form.useWatch('oidcClientId', form)

    useEffect(() => {
        if (!oidcClientId) {
            return
        }
        onChange(oidcClientId)
    }, [oidcClientId, onChange])

    return (
        <Form
            name='select-oidc-client'
            layout='vertical'
            requiredMark={false}
            form={form}
            onFinish={onFinish}
        >
            <Form.Item name='oidcClientId'>
                <CardBoxGroup isCreateAvailable={isCreateAvailable} items={clients}/>
            </Form.Item>
        </Form>
    )
}

const CreateClientForm: React.FC<CreateClientFormProps> = ({ form, environment, onFinish }) => {
    const intl = useIntl()
    const RedirectURILabel = intl.formatMessage({ id:'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.createClientForm.items.redirectUri.label' })
    const { requiredFieldValidator, urlValidator } = useValidations()

    return (
        <Form
            name='create-oidc-client-form'
            layout='vertical'
            requiredMark={false}
            form={form}
            onFinish={onFinish}
        >
            <Form.Item
                name='redirectUri'
                rules={[requiredFieldValidator, urlValidator]}
                label={RedirectURILabel}
            >
                <Input
                    placeholder={environment === AppEnvironment.Production ? PROD_REDIRECT_URI_EXAMPLE : DEV_REDIRECT_URI_EXAMPLE}
                />
            </Form.Item>
        </Form>
    )
}

export const ChangeClientModal: React.FC<ChangeClientModalProps> = ({ environment, appId, open, source, onCancel, onChange }) => {
    const intl = useIntl()
    const SelectClientFormTitle = intl.formatMessage({ id: `pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.${source}Source.title` })
    const CreateClientFormTitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.createClientForm.title' })
    const CreateClientFormDescription = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.createClientForm.description' })
    const CancelButtonText = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.actions.cancel' })
    const ContinueButtonText = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.actions.continue' })
    const LinkButtonText = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.actions.link' })
    const CreateButtonText = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.createClientForm.actions.create' })
    const BackButtonText = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.createClientForm.actions.back' })
    const CreationSuccessNotificationTitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.createClientForm.notifications.success.title' })
    const CreationSuccessNotificationDescription = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.createClientForm.notifications.success.description' })
    const ChangeSuccessNotificationTitle = intl.formatMessage({ id: `pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.${source}Source.notifications.success.title` })
    const ChangeSuccessNotificationDescription = intl.formatMessage({ id: 'pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.notEnabled.notifications.success.description' })

    const [formStep, setFormStep] = useState<FormStep>('select')
    const [selectedOidcClient, setSelectedOidcClient] = useState<string | undefined>(undefined)
    const [form] = Form.useForm()

    const { data: clientsData, loading: clientsLoading, previousData: previousClientsData } = useGetAllOidcClientsQuery({
        variables: {
            data: {
                environment,
            },
        },
        fetchPolicy: 'cache-and-network',
    })

    const clients = useMemo(() => clientsData?.clients ?? previousClientsData?.clients ?? [], [clientsData?.clients, previousClientsData?.clients])

    const isCreateAvailable = useMemo(() => (clientsData?.clients ?? []).every(client => client.clientId !== appId), [appId, clientsData?.clients])
    const translationPart = useMemo(() => isCreateAvailable ? 'createAvailable' : 'createNotAvailable', [isCreateAvailable])
    const SelectClientFormDescription = intl.formatMessage({ id: `pages.apps.any.id.sections.oidc.clientSettings.changeClientModal.selectClientForm.${translationPart}.description` })

    const ModalTitle = useMemo(() => {
        if (formStep === 'select') {
            return (
                <Space direction='vertical' size={8}>
                    <Typography.Title level={3}>{SelectClientFormTitle}</Typography.Title>
                    <Typography.Text type='secondary' size='medium'>{SelectClientFormDescription}</Typography.Text>
                </Space>
            )
        }

        return (
            <Space direction='vertical' size={8}>
                <Typography.Title level={3}>{CreateClientFormTitle}</Typography.Title>
                <Typography.Text type='secondary' size='medium'>{CreateClientFormDescription}</Typography.Text>
            </Space>
        )
    }, [CreateClientFormDescription, CreateClientFormTitle, SelectClientFormDescription, SelectClientFormTitle, formStep])

    const { setSecret } = useSecretContext()

    const handleClose = useCallback(() => {
        form.resetFields()
        setFormStep('select')
        setSelectedOidcClient(undefined)
        onCancel()
    }, [form, onCancel])

    const getNotificationArgs = useCallback((data: ChangeOidcClientMutation) => {
        const message = formStep === 'create' ? CreationSuccessNotificationTitle : ChangeSuccessNotificationTitle
        const description =
            formStep === 'create'
                ? CreationSuccessNotificationDescription
                : (
                    data.client?.isEnabled ? undefined : ChangeSuccessNotificationDescription
                )
        const duration = description ? 20 : undefined

        return { message, description, duration }
    }, [ChangeSuccessNotificationDescription, ChangeSuccessNotificationTitle, CreationSuccessNotificationDescription, CreationSuccessNotificationTitle, formStep])

    const onError = useMutationErrorHandler()

    const refetchQueries = useMemo(() => [{
        query: GetOidcClientDocument,
        variables: {
            data: {
                environment,
                app: { id: appId },
            },
        },
    }], [appId, environment])
    const onChangeCompleted = useCallback((data: ChangeOidcClientMutation) => {
        if (formStep !== 'create') {
            setSecret(null)
        }
        notification.success(getNotificationArgs(data))
        handleClose()
        if (data.client && onChange) {
            onChange(data.client)
        }
    }, [formStep, getNotificationArgs, handleClose, onChange, setSecret])
    const [changeOIDCClientMutation] = useChangeOidcClientMutation({
        onError,
        onCompleted: onChangeCompleted,
        refetchQueries,
    })


    const onCreateCompleted = useCallback((data: CreateOidcClientMutation) => {
        setSecret(data.client?.clientSecret || null)
        if (!data.client?.id) return

        void changeOIDCClientMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    app: { id: appId },
                    environment,
                    oidcClientId: data.client.id,
                },
            },
        })
    }, [appId, changeOIDCClientMutation, environment, setSecret])
    const [createOIDCClientMutation] = useCreateOidcClientMutation({
        onError,
        onCompleted: onCreateCompleted,
        refetchQueries,
    })

    const createOIDCClient = useCallback((values: CreateClientFormValues) => {
        void createOIDCClientMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    redirectUri: values.redirectUri,
                    app: { id: appId },
                    environment,
                },
            },
        })
    }, [appId, createOIDCClientMutation, environment])

    const selectOIDCClient = useCallback((values: SelectClientFormValues) => {
        if (!values.oidcClientId) return

        if (values.oidcClientId === 'create') {
            return setFormStep('create')
        }

        void changeOIDCClientMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    app: { id: appId },
                    environment,
                    oidcClientId: values.oidcClientId,
                },
            },
        })
    }, [appId, changeOIDCClientMutation, environment])

    const ModalContent = useMemo(() => {
        if (formStep === 'select') {
            if (clientsLoading && !clients.length) {
                return (
                    <Spin size='default'/>
                )
            }

            return (
                <SelectClientForm
                    isCreateAvailable={isCreateAvailable}
                    clients={clients}
                    onChange={setSelectedOidcClient}
                    form={form}
                    onFinish={selectOIDCClient}
                />
            )
        }

        return (
            <CreateClientForm
                environment={environment}
                form={form}
                onFinish={createOIDCClient}
            />
        )
    }, [clients, clientsLoading, createOIDCClient, environment, form, formStep, isCreateAvailable, selectOIDCClient])

    const CancelButton = useMemo(() => {
        if (formStep === 'select') {
            return (
                <Button type='secondary' onClick={handleClose}>
                    {CancelButtonText}
                </Button>
            )
        }

        return (
            <Button type='secondary' onClick={() => {
                form.resetFields(['redirectUrl'])
                setFormStep('select')
            }}>
                {BackButtonText}
            </Button>
        )
    }, [BackButtonText, CancelButtonText, form, formStep, handleClose])

    const ActionButton = useMemo(() => {
        if (formStep === 'select') {
            const label = selectedOidcClient === 'create' ? ContinueButtonText : LinkButtonText
            return (
                <Button
                    type='primary'
                    htmlType='submit'
                    disabled={!selectedOidcClient}
                    onClick={() => form.submit()}
                >
                    {label}
                </Button>
            )
        }

        return (
            <Button
                type='primary'
                htmlType='submit'
                onClick={() => form.submit()}
            >
                {CreateButtonText}
            </Button>
        )
    }, [LinkButtonText, ContinueButtonText, CreateButtonText, form, formStep, selectedOidcClient])

    const ModalFooter = useMemo(() => {
        return [
            CancelButton,
            ActionButton,
        ]
    }, [ActionButton, CancelButton])

    return (
        <Modal
            open={open}
            title={ModalTitle}
            onCancel={handleClose}
            footer={ModalFooter}
            scrollX={false}
        >
            {ModalContent}
        </Modal>
    )
}