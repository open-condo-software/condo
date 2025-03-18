import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Space, Typography, Input, Button, Alert, Modal } from '@open-condo/ui'

import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { REQUEST_LIMIT_ERRORS } from '@condo/domains/user/constants/errors'

import {
    useFindOrganizationsByTinLazyQuery,
    useRegisterNewOrganizationMutation,
    useGetOrganizationEmployeeByUserAndOrganizationLazyQuery, useSendOrganizationEmployeeRequestMutation,
} from '../../../gql'
import { useMutationErrorHandler } from '../../common/hooks/useMutationErrorHandler'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '../constants/common'

import './CreateOtganizationForm.css'


const { publicRuntimeConfig: { defaultLocale } } = getConfig()

const prepareValidators = ({ requiredValidator, tinValidator, locale }) => ({
    name: [requiredValidator],
    tin: [
        requiredValidator,
        tinValidator(locale),
    ],
})

type CreateOrganizationFormProps = {
    onSendOrganizationRequest?: () => Promise<void>
    onFormClose?: () => void
}

export const CreateOrganizationForm: React.FC<CreateOrganizationFormProps> = ({
    onSendOrganizationRequest,
    onFormClose,
}) => {
    const intl = useIntl()
    const CreateOrganizationPlaceholder = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationPlaceholder' })
    const ManagingCompanyMessage = intl.formatMessage({ id: 'pages.organizations.managingCompany' })
    const ServiceProviderMessage = intl.formatMessage({ id: 'pages.organizations.serviceProvider' })

    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.tin' })

    const [form] = Form.useForm()

    const { selectEmployee, organization } = useOrganization()
    const { user, signOut } = useAuth()
    const userId = user?.id
    const locale = organization?.country || defaultLocale

    const router = useRouter()
    const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)
    const [isFoundOrganizationModalOpen, setIsFoundOrganizationModalOpen] = useState<boolean>(false)
    const [isSearchByTinLimitReached, setIsSearchByTinLimitReached] = useState<boolean>(false)

    const { requiredValidator, tinValidator } = useValidations()
    const validators = React.useMemo(
        () => prepareValidators({
            requiredValidator,
            tinValidator,
            locale,
        }),
        [requiredValidator, tinValidator, locale],
    )
    const onError = useMutationErrorHandler({ form })
    const [findOrganizationsByTin, { data: foundOrganizationsData }] = useFindOrganizationsByTinLazyQuery({
        onError,
    })
    const [registerNewOrganization] = useRegisterNewOrganizationMutation({
        onError,
    })
    const [getOrganizationEmployee] = useGetOrganizationEmployeeByUserAndOrganizationLazyQuery({
        onError,
    })
    const [sendOrganizationEmployeeRequest] = useSendOrganizationEmployeeRequestMutation({
        onError,
    })

    const createOrganizationAction = useCallback(async (values) => {
        const foundOrganizationsByTinData = await findOrganizationsByTin({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    tin: values.tin,
                },
            },
        })
        const foundOrganizations = foundOrganizationsByTinData?.data?.data?.organizations || []
        const foundOrganizationsErrors = foundOrganizationsByTinData?.error

        if (foundOrganizationsErrors) {
            const hasLimitError = foundOrganizationsErrors.graphQLErrors?.some(
                error => REQUEST_LIMIT_ERRORS.includes(error?.extensions?.type)
            )
            if (hasLimitError) {
                setIsSearchByTinLimitReached(true)
            }
            return
        }

        if (foundOrganizations.length > 0) {
            setIsFoundOrganizationModalOpen(true)
            return
        }

        const registeredOrganizationData = await registerNewOrganization({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    country: defaultLocale,
                    meta: { dv: 1 },
                    name: values.name,
                    type: values.type,
                    tin: values.tin,
                },
            },
        })
        const registerOrganizationsError = registeredOrganizationData?.errors
        if (registerOrganizationsError) {
            return
        }

        const organizationId = registeredOrganizationData?.data?.organization?.id
        const newOrganizationEmployeeData = await getOrganizationEmployee({
            variables: {
                userId,
                organizationId,
            },
        })
        const newOrganizationEmployeeId = newOrganizationEmployeeData?.data?.employees?.[0]?.id
        // what if no newOrganizationEmployee ?
        await selectEmployee(newOrganizationEmployeeId)
        if (onFormClose) {
            onFormClose()
        }
    }, [findOrganizationsByTin, getOrganizationEmployee, onFormClose, registerNewOrganization, selectEmployee, userId])

    const foundOrganizations = useMemo(() => foundOrganizationsData?.data?.organizations || [], [foundOrganizationsData?.data?.organizations])

    const handleSendOrganizationRequest = useCallback(async () => {
        // Promise.all ?
        for (const organization of foundOrganizations) {
            await sendOrganizationEmployeeRequest({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organization: { id: organization.id },
                    },
                },
            })
        }

        setIsFoundOrganizationModalOpen(false)
        if (onSendOrganizationRequest) {
            await onSendOrganizationRequest()
        }
        if (onFormClose) {
            onFormClose()
        }
    }, [foundOrganizations, onFormClose, onSendOrganizationRequest, sendOrganizationEmployeeRequest])

    const handleCancelOrganizationCreation = useCallback(async () => {
        await signOut()
        // pass next link?
        await router.push('/auth/signin')
        if (onFormClose) {
            onFormClose()
        }
    }, [onFormClose, router, signOut])

    let OrganizationExistModalTitle = ''
    if (foundOrganizations.length === 1) {
        OrganizationExistModalTitle = `Организация ${foundOrganizations[0].name} с таким ИНН уже добавлена`
    } else if (foundOrganizations.length > 1) {
        OrganizationExistModalTitle = `ИНН ${form.getFieldValue('tin')} уже добавлен`
    }

    return (
        <>
            <Form
                validateTrigger='onBlur'
                layout='vertical'
                form={form}
                onFinish={createOrganizationAction}
            >
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Row gutter={[0, 24]}>
                            <Col span={24}>
                                <Typography.Title level={2}>
                                    Создайте организацию
                                </Typography.Title>
                            </Col>
                            {
                                isSearchByTinLimitReached && (
                                    <Alert
                                        type='error'
                                        message='Превышено количество попыток ввода ИНН'
                                        description='В целях безопасности для разблокировки регистрации обратитесь в чат поддержки'
                                        showIcon
                                    />
                                )
                            }
                        </Row>
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

                                            return (
                                                <Button
                                                    htmlType='submit'
                                                    type='primary'
                                                    className='create-organization-form-button'
                                                    disabled={isRequiredFieldsEmpty || isFieldsHasError || isSearchByTinLimitReached}
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
            </Form>
            <Modal
                open={isCancelModalOpen}
                onCancel={() => setIsCancelModalOpen(false)}
                title='Передумали создавать организацию?'
                footer={(
                    <Space size={16} direction='horizontal'>
                        <Button
                            type='secondary'
                            danger
                            onClick={handleCancelOrganizationCreation}
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
                    Вход на платформу будет доступен только после создания организации. Если вы уйдете с этой страницы
                    данные об организации не сохраняться.
                </Typography.Text>
            </Modal>
            <Modal
                open={isFoundOrganizationModalOpen}
                onCancel={() => setIsFoundOrganizationModalOpen(false)}
                title={OrganizationExistModalTitle}
                footer={(
                    <Space size={16} direction='horizontal'>
                        <Button type='secondary' onClick={() => setIsFoundOrganizationModalOpen(false)}>
                            Нет
                        </Button>
                        <Button type='primary' onClick={handleSendOrganizationRequest}>
                            Да, присоединиться
                        </Button>
                    </Space>
                )}
            >
                <Typography.Text type='secondary'>
                    Вы сотрудник и хотите присоединиться к организации?
                </Typography.Text>
            </Modal>
        </>
    )
}