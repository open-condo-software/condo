import { Col, Form, FormInstance, Row } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useApolloClient } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Space, Typography, Input, Button, Alert, Modal } from '@open-condo/ui'

import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { REQUEST_LIMIT_ERRORS } from '@condo/domains/user/constants/errors'

import {
    useFindOrganizationsByTinLazyQuery,
    useRegisterNewOrganizationMutation,
    useGetOrganizationEmployeeByUserAndOrganizationLazyQuery,
    useSendOrganizationEmployeeRequestMutation,
    FindOrganizationsByTinQueryResult,
    RegisterNewOrganizationMutationResult,
    GetActualOrganizationEmployeesDocument,
    useGetLastUserOrganizationEmployeeRequestLazyQuery,
    useGetLastActiveOrganizationEmployeeRequestByTinLazyQuery,
    GetLastActiveOrganizationEmployeeRequestByTinQueryResult, SendOrganizationEmployeeRequestMutationResult,
} from '../../../gql'
import { useMutationErrorHandler } from '../../common/hooks/useMutationErrorHandler'
import { DEFAULT_UNAVAILABLE_TINS, MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '../constants/common'

import './CreateOtganizationForm.css'


const { publicRuntimeConfig: { defaultLocale, unavailableTinsForOrganizationsSearch } } = getConfig()

const SKIP_SEARCH_TINS = [...unavailableTinsForOrganizationsSearch, ...DEFAULT_UNAVAILABLE_TINS]

const prepareValidators = ({ requiredValidator, tinValidator, locale }) => ({
    name: [requiredValidator],
    tin: [
        requiredValidator,
        tinValidator(locale),
    ],
})

type FoundOrganizationsModalProps = {
    isFoundOrganizationModalOpen: boolean
    setIsFoundOrganizationModalOpen: React.Dispatch<React.SetStateAction<boolean>>
    onSendOrganizationRequest: (request: SendOrganizationEmployeeRequestMutationResult['data']['request'], isDuplicateRequest: boolean) => void
    form: FormInstance
    foundOrganizations: FindOrganizationsByTinQueryResult['data']['data']['organizations']
}

const FoundOrganizationsModal: React.FC<FoundOrganizationsModalProps> = (props) => {
    const {
        isFoundOrganizationModalOpen,
        setIsFoundOrganizationModalOpen,
        form,
        onSendOrganizationRequest,
        foundOrganizations,
    } = props

    const client = useApolloClient()

    const intl = useIntl()

    const onError = useMutationErrorHandler({ form })
    const [sendOrganizationEmployeeRequest] = useSendOrganizationEmployeeRequestMutation({
        onError,
    })

    const handleSendOrganizationRequest = useCallback(async () => {
        let lastRequest: SendOrganizationEmployeeRequestMutationResult['data']['request']

        for (const organization of foundOrganizations) {
            const result = await sendOrganizationEmployeeRequest({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organization: { id: organization.id },
                    },
                },
            })
            lastRequest = result?.data?.request
        }

        setIsFoundOrganizationModalOpen(false)
        if (onSendOrganizationRequest) {
            await onSendOrganizationRequest(lastRequest, false)
        }

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allOrganizationEmployeeRequests' })
    }, [client.cache, form, foundOrganizations, onSendOrganizationRequest, sendOrganizationEmployeeRequest, setIsFoundOrganizationModalOpen])

    let OrganizationExistModalTitle = ''
    if (foundOrganizations.length === 1) {
        OrganizationExistModalTitle = `Организация ${foundOrganizations[0].name} с таким ИНН уже добавлена`
    } else if (foundOrganizations.length > 1) {
        OrganizationExistModalTitle = `ИНН ${form.getFieldValue('tin')} уже добавлен`
    }

    return (
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
    )
}

type BaseCreateOrganizationFormProps = {
    onSendOrganizationRequest?: (
        request: SendOrganizationEmployeeRequestMutationResult['data']['request'],
        isDuplicateRequest: boolean
    ) => void | Promise<void>
    onOrganizationCreated?: (organization: RegisterNewOrganizationMutationResult['data']['organization']) => void
}

type FormCreateOrganizationFormProps = {
    type: 'form'
    onCancel?: () => void
}

type ModalCreateOrganizationFormProps = {
    type: 'modal'
    isCreateOrganizationModalOpen: boolean
    setIsCreateOrganizationModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}

type CreateOrganizationFormProps = BaseCreateOrganizationFormProps & (
    FormCreateOrganizationFormProps | ModalCreateOrganizationFormProps
)

export const CreateOrganizationForm: React.FC<CreateOrganizationFormProps> = (props) => {
    const { type, onSendOrganizationRequest, onOrganizationCreated } = props

    const intl = useIntl()
    const CreateOrganizationPlaceholder = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationPlaceholder' })
    const ManagingCompanyMessage = intl.formatMessage({ id: 'pages.organizations.managingCompany' })
    const ServiceProviderMessage = intl.formatMessage({ id: 'pages.organizations.serviceProvider' })
    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.tin' })

    const [form] = Form.useForm()

    const client = useApolloClient()
    const { selectEmployee, organization } = useOrganization()
    const { user } = useAuth()
    const userId = user?.id

    // ??????? It is correct logic?
    const locale = organization?.country || defaultLocale

    const [isFoundOrganizationModalOpen, setIsFoundOrganizationModalOpen] = useState<boolean>(false)
    const [isSearchByTinLimitReached, setIsSearchByTinLimitReached] = useState<boolean>(false)
    const [isRequiredFieldsEmpty, setIsRequiredFieldsEmpty] = useState<boolean>(false)
    const [isFieldsHasError, setIsFieldsHasError] = useState<boolean>(false)

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
    const [getLastActiveOrganizationEmployeeRequest] = useGetLastActiveOrganizationEmployeeRequestByTinLazyQuery({
        onError,
    })

    const createOrganizationAction = useCallback(async (values) => {
        const tin = values.tin

        if (!SKIP_SEARCH_TINS.includes(tin)) {
            const foundOrganizationsByTinData = await findOrganizationsByTin({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        tin,
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

            if (type === 'modal') {
                const lastRequestByTinData = await getLastActiveOrganizationEmployeeRequest({
                    variables: {
                        userId,
                        tin,
                    },
                })
                const duplicatedRequest = lastRequestByTinData?.data?.requests?.[0]

                if (duplicatedRequest) {
                    if (onSendOrganizationRequest) {
                        onSendOrganizationRequest(duplicatedRequest, true)
                    }
                    return
                }
            }

            if (foundOrganizations.length > 0) {
                setIsFoundOrganizationModalOpen(true)
                return
            }
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

        const registeredOrganization = registeredOrganizationData?.data?.organization
        if (onOrganizationCreated) {
            onOrganizationCreated(registeredOrganization)
        }
        const organizationId = registeredOrganization?.id
        const newOrganizationEmployeeData = await getOrganizationEmployee({
            variables: {
                userId,
                organizationId,
            },
        })
        const newOrganizationEmployeeId = newOrganizationEmployeeData?.data?.employees?.[0]?.id

        if (newOrganizationEmployeeId) {
            await client.refetchQueries({
                include: [GetActualOrganizationEmployeesDocument],
            })
            await selectEmployee(newOrganizationEmployeeId)
        }
    }, [client, findOrganizationsByTin, getLastActiveOrganizationEmployeeRequest, getOrganizationEmployee, onOrganizationCreated, onSendOrganizationRequest, registerNewOrganization, selectEmployee, type, userId])

    const foundOrganizations = useMemo(() => foundOrganizationsData?.data?.organizations || [], [foundOrganizationsData?.data?.organizations])

    // reset form fields when modal closes
    useEffect(() => {
        if (form && props.type === 'modal' && !props.isCreateOrganizationModalOpen) {
            form.resetFields()
        }
    }, [form, props])

    const FormContent = (
        <Row gutter={[0, 40]}>
            <Form.Item hidden noStyle shouldUpdate>
                {
                    // In Modal Form we can't use Form.Item in footer to disable submit button when form has errors.
                    // Because of it, we need a hidden Form.Item which will track form errors state
                    ({ getFieldsValue, getFieldsError }) => {
                        const errors = getFieldsError(['name', 'tin'])
                        const values = getFieldsValue(['name', 'tin'])

                        const isRequiredFieldsEmpty = !values['name'] || !values['tin']
                        const isFieldsHasError = errors.some(error => error?.errors.length > 0)

                        setIsRequiredFieldsEmpty(isRequiredFieldsEmpty)
                        setIsFieldsHasError(isFieldsHasError)
                    }
                }
            </Form.Item>
            {
                (type === 'form' || isSearchByTinLimitReached) && (
                    <Col span={24}>
                        <Row gutter={[0, 24]}>
                            {
                                type === 'form' && (
                                    <Col span={24}>
                                        <Typography.Title level={2}>
                                            Создайте организацию
                                        </Typography.Title>
                                    </Col>
                                )
                            }
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
                )
            }
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
            {
                type === 'form' && (
                    <Col span={24}>
                        <Row gutter={[0, 24]}>
                            <Col span={24}>
                                <Form.Item noStyle shouldUpdate>
                                    <Button
                                        htmlType='submit'
                                        type='primary'
                                        className='create-organization-form-button'
                                        disabled={isRequiredFieldsEmpty || isFieldsHasError || isSearchByTinLimitReached}
                                    >
                                        Создать
                                    </Button>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Button
                                    type='secondary'
                                    className='create-organization-form-button'
                                    onClick={props.onCancel}
                                >
                                    Отмена
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                )
            }
        </Row>
    )

    if (type === 'modal') {
        const { isCreateOrganizationModalOpen, setIsCreateOrganizationModalOpen } = props

        return (
            <>
                <Modal
                    open={isCreateOrganizationModalOpen}
                    onCancel={() => {
                        setIsCreateOrganizationModalOpen(false)
                    }}
                    title='Создание организации'
                    footer={(
                        <Space size={16}>
                            <Button
                                type='secondary'
                                onClick={() => {
                                    setIsCreateOrganizationModalOpen(false)
                                }}
                            >
                                Отменить
                            </Button>
                            <Button
                                type='primary'
                                htmlType='submit'
                                onClick={() => {
                                    form.submit()
                                }}
                                disabled={isRequiredFieldsEmpty || isFieldsHasError || isSearchByTinLimitReached}
                            >
                                Создать
                            </Button>
                        </Space>
                    )}
                >
                    <Form
                        validateTrigger='onBlur'
                        layout='vertical'
                        form={form}
                        onFinish={createOrganizationAction}
                    >
                        {FormContent}
                    </Form>
                </Modal>
                <FoundOrganizationsModal
                    form={form}
                    isFoundOrganizationModalOpen={isFoundOrganizationModalOpen}
                    setIsFoundOrganizationModalOpen={setIsFoundOrganizationModalOpen}
                    foundOrganizations={foundOrganizations}
                    onSendOrganizationRequest={onSendOrganizationRequest}
                />
            </>
        )
    }

    return (
        <>
            <Form
                validateTrigger='onBlur'
                layout='vertical'
                form={form}
                onFinish={createOrganizationAction}
            >
                {FormContent}
            </Form>
            <FoundOrganizationsModal
                form={form}
                isFoundOrganizationModalOpen={isFoundOrganizationModalOpen}
                setIsFoundOrganizationModalOpen={setIsFoundOrganizationModalOpen}
                foundOrganizations={foundOrganizations}
                onSendOrganizationRequest={onSendOrganizationRequest}
            />
        </>
    )
}