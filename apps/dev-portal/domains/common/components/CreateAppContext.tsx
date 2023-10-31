import { Form, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { createContext, CSSProperties, useCallback, useContext, useState } from 'react'
import { useIntl } from 'react-intl'

import { Modal, RadioGroup, Radio, Space, Input, Button } from '@open-condo/ui'
import type { RadioGroupProps } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'

import type { RowProps } from 'antd'

import { useAuth } from '@/lib/auth'
import { useCreateB2CAppMutation, CreateB2CAppMutation, AllAppsDocument } from '@/lib/gql'

type CreateAppContextType = {
    createApp: () => void
}

const CreateAppContext = createContext<CreateAppContextType>({
    createApp: () => ({}),
})

const ROW_FORM_GUTTER: RowProps['gutter'] = [0, 0]
const COL_FULL_SPAN = 24
const B2B_APP_VALUE = 'b2b' as const
const B2C_APP_VALUE = 'b2c' as const
const BOTTOM_FORM_ITEM_STYLES: CSSProperties = { marginBottom: 0 }

type CreateAppFormValues = {
    type: typeof B2B_APP_VALUE | typeof B2C_APP_VALUE
    name: string
}

export const CreateAppContextProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const intl = useIntl()
    const NewAppTitle = intl.formatMessage({ id: 'global.newAppForm.title' })
    const B2BAppLabel = intl.formatMessage({ id: 'global.newAppForm.b2bApp.label' })
    const B2CAppLabel = intl.formatMessage({ id: 'global.newAppForm.b2cApp.label' })
    const AppNameLabel = intl.formatMessage({ id: 'global.newAppForm.appName.label' })
    const CreateLabel = intl.formatMessage({ id: 'global.newAppForm.submit.label' })

    const [openModal, setOpenModal] = useState(false)
    const [form] = Form.useForm()
    const { trimValidator } = useValidations()

    const router = useRouter()
    const { user } = useAuth()

    const onError = useMutationErrorHandler()
    const onB2CCompleted = useCallback((data: CreateB2CAppMutation) => {
        setOpenModal(false)
        const id = data.createB2CApp?.id
        if (id) {
            const url = `/apps/${B2C_APP_VALUE}/${id}`
            router.push(url, url, { locale: router.locale })
        }
    }, [router])
    const [createB2CAppMutation] = useCreateB2CAppMutation({
        onError,
        onCompleted: onB2CCompleted,
        refetchQueries: [{ query: AllAppsDocument, variables: { creator: { id: user?.id } } }],
    })

    const handleModalOpen = useCallback(() => {
        setOpenModal(true)
    }, [])

    const handleModalClose = useCallback(() => {
        setOpenModal(false)
    }, [])

    const handleAppTypeChange = useCallback<Required<RadioGroupProps>['onChange']>((evt) => {
        form.setFieldValue('type', evt.target.value)
    }, [form])

    const handleFormSubmit = useCallback((values: CreateAppFormValues) => {
        const data = {
            dv: 1,
            sender: getClientSideSenderInfo(),
            name: values.name,
        }
        if (values.type === B2C_APP_VALUE) {
            createB2CAppMutation({ variables: { data } })
        }
    }, [createB2CAppMutation])

    return (
        <CreateAppContext.Provider value={{ createApp: handleModalOpen }}>
            {children}
            {openModal && (
                <Modal
                    title={NewAppTitle}
                    open={openModal}
                    onCancel={handleModalClose}
                    footer={<Button type='primary' htmlType='submit' onClick={form.submit}>{CreateLabel}</Button>}
                >
                    <Form
                        name='create-app'
                        layout='vertical'
                        form={form}
                        onFinish={handleFormSubmit}
                        initialValues={{ type: B2C_APP_VALUE }}
                    >
                        <Row gutter={ROW_FORM_GUTTER}>
                            <Col span={COL_FULL_SPAN}>
                                <Form.Item name='type'>
                                    <RadioGroup onChange={handleAppTypeChange}>
                                        <Space direction='vertical' size={8} wrap>
                                            <Radio label={B2CAppLabel} value={B2C_APP_VALUE}/>
                                            <Radio label={B2BAppLabel} value={B2B_APP_VALUE} disabled/>
                                        </Space>
                                    </RadioGroup>
                                </Form.Item>
                            </Col>
                            <Col span={COL_FULL_SPAN}>
                                <Form.Item
                                    name='name'
                                    label={AppNameLabel}
                                    style={BOTTOM_FORM_ITEM_STYLES}
                                    rules={[trimValidator]}
                                >
                                    <Input/>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            )}
        </CreateAppContext.Provider>
    )
}

export const useCreateAppContext = (): CreateAppContextType => useContext(CreateAppContext)