import { useApolloClient } from '@apollo/client'
import { Form, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { createContext, CSSProperties, useCallback, useContext, useMemo, useState } from 'react'
import { useIntl, FormattedMessage } from 'react-intl'

import { Smartphone, Monitor } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Modal, Input, Button } from '@open-condo/ui'
import { useContainerSize } from '@open-condo/ui/hooks'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { AuthenticatedUserType, useAuth } from '@/domains/user/utils/auth'

import { AppCard } from './AppCard'

import type { RowProps } from 'antd'

import {
    useCreateB2BAppMutation,
    CreateB2BAppMutation,
    useCreateB2CAppMutation,
    CreateB2CAppMutation,
} from '@/gql'

type CreateAppContextType = {
    createApp: () => void
}

const CreateAppContext = createContext<CreateAppContextType>({
    createApp: () => ({}),
})

const APP_CARDS_ROW_GUTTER: RowProps['gutter'] = [20, 20]
const MAX_RANDOM_NAMES = 4
const BOTTOM_FORM_ITEM_STYLES: CSSProperties = { marginBottom: 0 }
const FULL_WIDTH_THRESHOLD = 500

const B2B_WEB_APP_VALUE = 'b2bWebApp' as const
const B2C_NATIVE_APP_VALUE = 'b2cNativeApp' as const
const APP_TYPES = [
    {
        key: B2C_NATIVE_APP_VALUE,
        icon: <Smartphone size='medium'/>,
        value: B2C_NATIVE_APP_VALUE,
        span: 12,
    },
    {
        key: B2B_WEB_APP_VALUE,
        icon: <Monitor size='medium'/>,
        value: B2B_WEB_APP_VALUE,
        disabled: (user: AuthenticatedUserType) => !(user?.isSupport || user?.isAdmin),
        span: 12,
    },
]

type AppType = typeof APP_TYPES[number]['value']

type CreateAppFormValues = {
    type: AppType
    name: string
}

type AppTypeSelectorProps = {
    value: AppType
    onChange: (value: AppType) => void
}

const AppTypeSelector: React.FC<AppTypeSelectorProps> = ({ onChange, value }) => {
    const [{ width }, setRef] = useContainerSize()
    const { user } = useAuth()

    return (
        <Row gutter={APP_CARDS_ROW_GUTTER} ref={setRef}>
            {APP_TYPES.map(appType => (
                <Col span={width >= FULL_WIDTH_THRESHOLD ? appType.span : 24} key={appType.key}>
                    <AppCard
                        icon={appType.icon}
                        title={(
                            <FormattedMessage id={`components.common.createAppContext.createAppForm.items.type.${appType.value}.label`} />
                        )}
                        subtitle={(
                            <FormattedMessage id={`components.common.createAppContext.createAppForm.items.type.${appType.value}.description`} />
                        )}
                        checked={value === appType.value}
                        onClick={() => onChange(appType.value)}
                        disabled={appType.disabled?.(user)}
                    />
                </Col>
            ))}
        </Row>
    )
}

export const CreateAppContextProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const intl = useIntl()
    const ContinueLabel = intl.formatMessage({ id: 'components.common.createAppContext.createAppForm.actions.continue' })
    const BackLabel = intl.formatMessage({ id: 'components.common.createAppContext.createAppForm.actions.back' })
    const CreateLabel = intl.formatMessage({ id: 'components.common.createAppContext.createAppForm.actions.create' })

    const client = useApolloClient()

    const [openModal, setOpenModal] = useState(false)
    const [form] = Form.useForm()
    const { trimValidator } = useValidations()

    const [appType, setAppType] = useState<AppType>(B2C_NATIVE_APP_VALUE)
    const [isAppTypeSelected, setIsAppTypeSelected] = useState(false)

    const router = useRouter()

    const clearFormState = useCallback(() => {
        form.resetFields(['name'])
        setIsAppTypeSelected(false)
        setAppType(B2C_NATIVE_APP_VALUE)
    }, [form])

    const handleModalOpen = useCallback(() => {
        setOpenModal(true)
    }, [])
    const handleModalClose = useCallback(() => {
        setAppType(B2C_NATIVE_APP_VALUE)
        clearFormState()
        setOpenModal(false)
    }, [clearFormState])

    const clearAppsCache = useCallback(() => {
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allB2BApps' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allB2CApps' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: '_allB2BAppsMeta' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: '_allB2CAppsMeta' })
    }, [client])

    const onError = useMutationErrorHandler()
    const onCompleted = useCallback((data: CreateB2CAppMutation | CreateB2BAppMutation) => {
        handleModalClose()
        clearAppsCache()
        const id = data.app?.id
        const appType = data.app?.__typename === 'B2CApp' ? 'b2c' : 'b2b'
        if (id) {
            const url = `/apps/${appType}/${id}`
            router.push(url, url, { locale: router.locale })
        }
    }, [clearAppsCache, handleModalClose, router])

    const [createB2CAppMutation] = useCreateB2CAppMutation({
        onError,
        onCompleted,
    })
    const [createB2BAppMutation] = useCreateB2BAppMutation({
        onError,
        onCompleted,
    })

    const handleAppTypeChange = useCallback((value: AppType) => {
        setAppType(value)
        form.setFieldValue('type', value)
    }, [form])

    const handleFormSubmit = useCallback((values: CreateAppFormValues) => {
        if (values.type === B2C_NATIVE_APP_VALUE) {
            createB2CAppMutation({ variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    name: values.name,
                },
            } })
        } else {
            createB2BAppMutation({ variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    name: values.name,
                },
            } })
        }
    }, [createB2BAppMutation, createB2CAppMutation])

    const ModalTitle = useMemo(() => {
        if (!isAppTypeSelected) {
            return <FormattedMessage id='components.common.createAppContext.createAppForm.steps.selectAppType.title' />
        }

        return <FormattedMessage id='components.common.createAppContext.createAppForm.steps.enterAppName.title' />
    }, [isAppTypeSelected])

    const ModalFooter = useMemo(() => {
        if (!isAppTypeSelected) {
            return (
                <Button type='primary' onClick={() => setIsAppTypeSelected(true)}>{ContinueLabel}</Button>
            )
        }

        return [
            <Button key='cancel' type='secondary' onClick={() => setIsAppTypeSelected(false)}>{BackLabel}</Button>,
            <Button key='cancel' type='primary' onClick={() => form.submit()}>{CreateLabel}</Button>,
        ]
    }, [BackLabel, ContinueLabel, CreateLabel, form, isAppTypeSelected])

    const ModalBody = useMemo(() => {
        if (!isAppTypeSelected) {
            return (
                <AppTypeSelector
                    value={appType}
                    onChange={handleAppTypeChange}
                />
            )
        }

        const placeholderIndex = Math.floor(Math.random() * MAX_RANDOM_NAMES + 1)
        // @ts-expect-error Type ... is not assignable to type MessagesKeysType | undefined
        const randomPlaceHolder = intl.formatMessage({ id: `components.common.createAppContext.createAppForm.items.name.placeholder.option.${placeholderIndex}` })

        return (
            <Form.Item name='name' rules={[trimValidator]} style={BOTTOM_FORM_ITEM_STYLES}>
                <Input placeholder={randomPlaceHolder}/>
            </Form.Item>
        )
    }, [appType, handleAppTypeChange, intl, isAppTypeSelected, trimValidator])


    return (
        <CreateAppContext.Provider value={{ createApp: handleModalOpen }}>
            {children}
            {openModal && (
                <Modal
                    title={ModalTitle}
                    open={openModal}
                    onCancel={handleModalClose}
                    footer={ModalFooter}
                >
                    <Form
                        name='create-app-form'
                        layout='vertical'
                        form={form}
                        onFinish={handleFormSubmit}
                        initialValues={{ type: B2C_NATIVE_APP_VALUE }}
                    >
                        <Form.Item name='type' hidden/>
                        {ModalBody}
                    </Form>
                </Modal>
            )}
        </CreateAppContext.Provider>
    )
}

export const useCreateAppContext = (): CreateAppContextType => useContext(CreateAppContext)