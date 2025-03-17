import { Col, Form, Row } from 'antd'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Space, Typography, Input, Button, Alert, Modal } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '../constants/common'
import { EMPTY_NAME_ERROR, TIN_TOO_SHORT_ERROR, TIN_VALUE_INVALID } from '../constants/errors'
import { convertUIStateToGQLItem } from '../utils/clientSchema'

import './CreateOtganizationForm.css'


const { publicRuntimeConfig: { defaultLocale } } = getConfig()

const adaptOrganizationMeta = (values) => {
    const { name, tin, type } = values

    return convertUIStateToGQLItem({
        name,
        tin: tin.trim(),
        meta: { dv: 1 },
        type: type || MANAGING_COMPANY_TYPE,
    })
}
const prepareValidationErrorsMapping = ({ ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid }) => ({
    [EMPTY_NAME_ERROR]: {
        name: 'name',
        errors: [ValueIsTooShortMsg],
    },
    [TIN_TOO_SHORT_ERROR]: {
        name: 'tin',
        errors: [TinTooShortMsg],
    },
    [TIN_VALUE_INVALID]: {
        name: 'tin',
        errors: [TinValueIsInvalid],
    },
})
const prepareValidators = ({ requiredValidator, tinValidator, locale }) => ({
    name: [requiredValidator],
    tin: [
        requiredValidator,
        tinValidator(locale),
    ],
})

const FORM_LAYOUT_PROPS = {
    labelCol: {
        // md: 6,
        span: 24,
    },
    wrapperCol: {
        // md: 18,
        span: 24,
    },
    // layout: 'horizontal',
    // labelAlign: 'left',
}


export const CreateOrganizationForm = () => {
    const intl = useIntl()

    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const CreateOrganizationPlaceholder = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationPlaceholder' })
    const ManagingCompanyMessage = intl.formatMessage({ id: 'pages.organizations.managingCompany' })
    const ServiceProviderMessage = intl.formatMessage({ id: 'pages.organizations.serviceProvider' })

    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.tin' })
    const TinTooShortMsg = intl.formatMessage({ id: 'pages.organizations.tin.TooShortMessage' })
    const TinValueIsInvalid = intl.formatMessage({ id: 'pages.organizations.tin.InvalidValue' })

    // const [form] = Form.useForm()

    const [isVisible, setIsVisible] = useState<boolean>(false)
    const { selectEmployee, organization } = useOrganization()
    const { user, signOut } = useAuth()
    const userId = user?.id
    const locale = organization?.country || defaultLocale

    const router = useRouter()
    const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)

    const ErrorToFormFieldMsgMapping = React.useMemo(
        () => prepareValidationErrorsMapping({ ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid }),
        [ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid]
    )
    const { requiredValidator, tinValidator } = useValidations()
    const validators = React.useMemo(
        () => prepareValidators({
            requiredValidator,
            tinValidator,
            locale,
        }),
        [requiredValidator, tinValidator, locale],
    )

    const createOrganizationAction = useCallback(async (values) => {
        console.log('values', values)
    }, [])

    return (
        <>
            <FormWithAction
                action={createOrganizationAction}
                style={{ maxWidth: '350px' }}
                validateTrigger='onBlur'
            >
                {
                    ({ handleSave }) => {
                        return (
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Typography.Title level={2}>
                                        Создайте организацию
                                    </Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name='type'>
                                        <RadioGroup defaultValue={MANAGING_COMPANY_TYPE}>
                                            <Space direction='vertical' size={16}>
                                                <Radio value={MANAGING_COMPANY_TYPE} label={ManagingCompanyMessage}/>
                                                <Radio value={SERVICE_PROVIDER_TYPE} label={ServiceProviderMessage}/>
                                            </Space>
                                        </RadioGroup>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Row gutter={[0, 32]}>
                                        <Col span={24}>
                                            <Row gutter={[0, 24]}>
                                                <Col span={24}>
                                                    <Form.Item
                                                        name='name'
                                                        label={NameMsg}
                                                        rules={validators.name}
                                                    >
                                                        <Input placeholder={CreateOrganizationPlaceholder}/>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Alert
                                                        type='info'
                                                        description='Введите официальное название организации. Оно будет автоматически копироваться в различные документы.'
                                                    />
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name='tin'
                                                label={InnMessage}
                                                rules={validators.tin}
                                            >
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <Row gutter={[0, 24]}>
                                        <Col span={24}>
                                            <Form.Item noStyle shouldUpdate>
                                                {
                                                    ({ getFieldsValue, getFieldsError }) => {
                                                        const errors = getFieldsError(['name', 'tin'])
                                                        const values = getFieldsValue(['name', 'tin'])

                                                        const isRequiredFieldsEmpty = !values['name'] || !values['tin']
                                                        const isFieldsHasError = errors.some(error => error?.errors.length > 0)

                                                        console.log('errors', errors)

                                                        return (
                                                            <Button
                                                                onClick={handleSave}
                                                                type='primary'
                                                                className='create-organization-form-button'
                                                                disabled={isRequiredFieldsEmpty || isFieldsHasError}
                                                            >
                                                                Создать
                                                            </Button>
                                                        )
                                                    }
                                                }
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Button
                                                type='secondary'
                                                className='create-organization-form-button'
                                                onClick={() => setIsCancelModalOpen(true)}
                                            >
                                                Отмена
                                            </Button>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        )
                    }
                }
            </FormWithAction>
            <Modal
                open={isCancelModalOpen}
                onCancel={() => setIsCancelModalOpen(false)}
                title='Передумали создавать организацию?'
                footer={(
                    <Space size={16} direction='horizontal'>
                        <Button
                            type='secondary'
                            danger
                            onClick={async () => {
                                await signOut()
                                // pass next link?
                                await router.push('/auth/signin')
                            }}
                        >
                            Уйти
                        </Button>
                        <Button type='secondary' onClick={() => setIsCancelModalOpen(false)}>
                            Остаться
                        </Button>
                    </Space>
                )}
            >
                <Typography.Text type='secondary'>
                    Вход на платформу будет доступен только после создания организации. Если вы уйдете с этой страницы  данные об организации не сохраняться.
                </Typography.Text>
            </Modal>
        </>
    )
}