import {
    useFindOrganizationsByTinLazyQuery,
    useRegisterNewOrganizationMutation,
    useGetOrganizationEmployeeByUserAndOrganizationLazyQuery,
    useSendOrganizationEmployeeRequestMutation,
    FindOrganizationsByTinQueryResult,
    RegisterNewOrganizationMutationResult,
    useGetLastActiveOrganizationEmployeeRequestByTinLazyQuery,
    SendOrganizationEmployeeRequestMutationResult,
    GetActualOrganizationEmployeesDocument,
    useActivateSubscriptionPlanMutation,
    useGetAvailableSubscriptionPlansLazyQuery,
} from '@app/condo/gql'
import { Col, Form, FormInstance, Row } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useApolloClient } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Space, Typography, Input, Button, Alert, Modal } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { SKIP_SEARCH_ORGANIZATION_BY_TIN, DEFAULT_TRIAL_SUBSCRIPTION_PLAN_ID } from '@condo/domains/common/constants/featureflags'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'
import { SecondaryLink } from '@condo/domains/user/components/auth/SecondaryLink'
import { REQUEST_LIMIT_ERRORS } from '@condo/domains/user/constants/errors'


const { publicRuntimeConfig: { defaultLocale, HelpRequisites } } = getConfig()

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

    const intl = useIntl()
    const SendOrganizationRequestMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.foundOrganizationsModal.sendRequest' })
    const FoundOrganizationsModalTitle = intl.formatMessage({ id: 'organization.createOrganizationForm.foundOrganizationsModal.title' })
    const No = intl.formatMessage({ id: 'No' })

    const client = useApolloClient()

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
    }, [client.cache, foundOrganizations, onSendOrganizationRequest, sendOrganizationEmployeeRequest, setIsFoundOrganizationModalOpen])

    const closeFoundOrganizationsModal = useCallback(() => setIsFoundOrganizationModalOpen(false), [setIsFoundOrganizationModalOpen])

    let OrganizationExistModalTitle = ''
    if (foundOrganizations.length === 1) {
        OrganizationExistModalTitle = intl.formatMessage(
            { id: 'organization.createOrganizationForm.foundOrganizationsModal.title.singleOrganization' },
            { name: foundOrganizations[0].name, tin: form.getFieldValue('tin') }
        )
    } else if (foundOrganizations.length > 1) {
        OrganizationExistModalTitle = intl.formatMessage(
            { id: 'organization.createOrganizationForm.foundOrganizationsModal.title.multipleOrganizations' },
            { tin: form.getFieldValue('tin') }
        )
    }

    return (
        <Modal
            open={isFoundOrganizationModalOpen}
            onCancel={closeFoundOrganizationsModal}
            title={OrganizationExistModalTitle}
            footer={(
                <Space size={16} direction='horizontal'>
                    <Button type='secondary' onClick={closeFoundOrganizationsModal}>
                        {No}
                    </Button>
                    <Button type='primary' onClick={handleSendOrganizationRequest}>
                        {SendOrganizationRequestMessage}
                    </Button>
                </Space>
            )}
        >
            <Typography.Text type='secondary'>
                {FoundOrganizationsModalTitle}
            </Typography.Text>
        </Modal>
    )
}

type BaseCreateOrganizationFormProps = {
    onSendOrganizationRequest?: (
        request: SendOrganizationEmployeeRequestMutationResult['data']['request'],
        isDuplicateRequest: boolean
    ) => void | Promise<void>
    onOrganizationCreated?: (organization: RegisterNewOrganizationMutationResult['data']['organization']) => void | Promise<void>
    onEmployeeSelected?: () => void | Promise<void>
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
    const { type, onSendOrganizationRequest, onOrganizationCreated, onEmployeeSelected } = props

    const intl = useIntl()
    const CreateOrganizationPlaceholder = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationPlaceholder' })
    const ManagingCompanyMessage = intl.formatMessage({ id: 'pages.organizations.managingCompany' })
    const ServiceProviderMessage = intl.formatMessage({ id: 'pages.organizations.serviceProvider' })
    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.tin' })
    const FormTitleMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.title' })
    const SearchByTinLimitMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.searchByTinLimit.message' })
    const SupportChatMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.supportChat' })
    const SearchByTinLimitDescription = intl.formatMessage({ id: 'organization.createOrganizationForm.limit.description' }, {
        chatBotLink: (
            <SecondaryLink target='_blank' href={HelpRequisites?.support_bot ? `https://t.me/${HelpRequisites.support_bot}` : '#'}>
                {SupportChatMessage}
            </SecondaryLink>
        ),
    })
    const NameFieldDescription = intl.formatMessage({ id: 'organization.createOrganizationForm.field.name.description' })
    const CreateMessage = intl.formatMessage({ id: 'Create' })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })

    const [form] = Form.useForm()

    const client = useApolloClient()
    const { selectEmployee, organization } = useOrganization()
    const { user } = useAuth()
    const userId = useMemo(() => user?.id, [user?.id])
    const locale = useMemo(() => organization?.country || defaultLocale, [organization?.country])
    const { useFlag, useFlagValue } = useFeatureFlags()
    const skipSearchOrganizationByTin = useFlag(SKIP_SEARCH_ORGANIZATION_BY_TIN)
    const defaultTrialPlanId = useFlagValue(DEFAULT_TRIAL_SUBSCRIPTION_PLAN_ID) as string

    const [isFoundOrganizationModalOpen, setIsFoundOrganizationModalOpen] = useState<boolean>(false)
    const [isSearchByTinLimitReached, setIsSearchByTinLimitReached] = useState<boolean>(false)
    const [isRequiredFieldsEmpty, setIsRequiredFieldsEmpty] = useState<boolean>(false)
    const [isFieldsHasError, setIsFieldsHasError] = useState<boolean>(false)
    const [isOrganizationCreating, setIsOrganizationCreating] = useState<boolean>(false)

    const { requiredValidator, tinValidator } = useValidations()
    const validators = useMemo(() => ({
        name: [requiredValidator],
        tin: [
            requiredValidator,
            tinValidator(locale),
        ],
    }), [requiredValidator, tinValidator, locale])
    const onError = useMutationErrorHandler({ form })
    const [findOrganizationsByTin, { data: foundOrganizationsData }] = useFindOrganizationsByTinLazyQuery({
        onError,
        fetchPolicy: 'network-only',
    })
    const [registerNewOrganization] = useRegisterNewOrganizationMutation({
        onError,
    })
    const [getOrganizationEmployee] = useGetOrganizationEmployeeByUserAndOrganizationLazyQuery({
        onError,
        fetchPolicy: 'network-only',
    })
    const [getLastActiveOrganizationEmployeeRequest] = useGetLastActiveOrganizationEmployeeRequestByTinLazyQuery({
        onError,
        fetchPolicy: 'network-only',
    })
    const [activateSubscriptionPlan] = useActivateSubscriptionPlanMutation({
        onError,
    })
    const [getAvailableSubscriptionPlans] = useGetAvailableSubscriptionPlansLazyQuery({
        onError,
    })

    const createOrganizationAction = useCallback(async (values) => {
        setIsOrganizationCreating(true)
        const tin = values?.tin?.trim()

        if (!skipSearchOrganizationByTin) {
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
            // NOTE: skip organization duplicates check if it's unavailable tin
            const isUnavailableTin = foundOrganizationsErrors?.graphQLErrors?.some(
                error => error?.extensions?.type === 'UNAVAILABLE_TIN'
            )

            if (!isUnavailableTin) {
                if (foundOrganizationsErrors) {
                    const hasLimitError = foundOrganizationsErrors.graphQLErrors?.some(
                        error => REQUEST_LIMIT_ERRORS.includes(typeof error?.extensions?.type === 'string' ? error?.extensions?.type : String(error?.extensions?.type))
                    )
                    if (hasLimitError) {
                        setIsSearchByTinLimitReached(true)
                    }
                    setIsOrganizationCreating(false)
                    return
                }

                if (type === 'modal') {
                    const lastRequestByTinData = await getLastActiveOrganizationEmployeeRequest({
                        variables: {
                            userId,
                            tin,
                        },
                    })
                    const duplicatedRequest = lastRequestByTinData?.data?.requests?.filter(Boolean)?.[0]

                    if (duplicatedRequest) {
                        if (onSendOrganizationRequest) {
                            await onSendOrganizationRequest(duplicatedRequest, true)
                        }
                        setIsOrganizationCreating(false)
                        return
                    }
                }

                if (foundOrganizations.length > 0) {
                    setIsFoundOrganizationModalOpen(true)
                    setIsOrganizationCreating(false)
                    return
                }
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
                    tin,
                },
            },
        })
        const registerOrganizationsError = registeredOrganizationData?.errors
        if (registerOrganizationsError) {
            setIsOrganizationCreating(false)
            return
        }

        const registeredOrganization = registeredOrganizationData?.data?.organization
        if (onOrganizationCreated) {
            await onOrganizationCreated(registeredOrganization)
        }
        const organizationId = registeredOrganization?.id

        try {
            if (defaultTrialPlanId) {
                const plansData = await getAvailableSubscriptionPlans({
                    variables: {
                        organization: { id: organizationId },
                    },
                })
                
                const plans = plansData?.data?.result?.plans || []
                const targetPlan = plans.find(p => p.plan.id === defaultTrialPlanId)
                const pricingRuleId = targetPlan?.prices?.[0]?.id
                
                if (pricingRuleId) {
                    await activateSubscriptionPlan({
                        variables: {
                            data: {
                                dv: 1,
                                sender: getClientSideSenderInfo(),
                                organization: { id: organizationId },
                                pricingRule: { id: pricingRuleId },
                                isTrial: true,
                            },
                        },
                    })
                }
            }
        } catch (error) {
            console.error('Failed to activate trial subscription:', error)
        }

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
            if (onEmployeeSelected) {
                await onEmployeeSelected()
            }
        }
        setIsOrganizationCreating(false)
    }, [
        activateSubscriptionPlan, client, defaultTrialPlanId, findOrganizationsByTin,
        getAvailableSubscriptionPlans, getLastActiveOrganizationEmployeeRequest,
        getOrganizationEmployee, onEmployeeSelected, onOrganizationCreated, onSendOrganizationRequest,
        registerNewOrganization, selectEmployee, skipSearchOrganizationByTin, type, userId,
    ])

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

                        return null
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
                                            {FormTitleMessage}
                                        </Typography.Title>
                                    </Col>
                                )
                            }
                            {
                                isSearchByTinLimitReached && (
                                    <Alert
                                        type='error'
                                        message={SearchByTinLimitMessage}
                                        description={SearchByTinLimitDescription}
                                        showIcon
                                    />
                                )
                            }
                        </Row>
                    </Col>
                )
            }
            <Col span={24}>
                <FormItem name='type'>
                    <RadioGroup defaultValue={MANAGING_COMPANY_TYPE}>
                        <Space direction='vertical' size={16}>
                            <Radio value={MANAGING_COMPANY_TYPE} label={ManagingCompanyMessage}/>
                            <Radio value={SERVICE_PROVIDER_TYPE} label={ServiceProviderMessage}/>
                        </Space>
                    </RadioGroup>
                </FormItem>
            </Col>
            <Col span={24}>
                <Row gutter={[0, 32]}>
                    <Col span={24}>
                        <Row gutter={[0, 24]}>
                            <Col span={24}>
                                <FormItem
                                    name='name'
                                    label={NameMsg}
                                    rules={validators.name}
                                    validateTrigger='onChange'
                                >
                                    <Input placeholder={CreateOrganizationPlaceholder}/>
                                </FormItem>
                            </Col>
                            <Col span={24}>
                                <Alert
                                    type='info'
                                    description={NameFieldDescription}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name='tin'
                            label={InnMessage}
                            rules={validators.tin}
                            validateTrigger='onChange'
                        >
                            <Input/>
                        </FormItem>
                    </Col>
                </Row>
            </Col>
            {
                type === 'form' && (
                    <Col span={24}>
                        <Row gutter={[0, 24]}>
                            <Col span={24}>
                                <FormItem noStyle shouldUpdate>
                                    <Button
                                        htmlType='submit'
                                        type='primary'
                                        block
                                        loading={isOrganizationCreating}
                                        disabled={isRequiredFieldsEmpty || isFieldsHasError || isSearchByTinLimitReached}
                                    >
                                        {CreateMessage}
                                    </Button>
                                </FormItem>
                            </Col>
                            <Col span={24}>
                                <Button
                                    type='secondary'
                                    block
                                    onClick={props.onCancel}
                                >
                                    {CancelMessage}
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
                    title={FormTitleMessage}
                    footer={(
                        <Space size={16}>
                            <Button
                                type='secondary'
                                onClick={() => {
                                    setIsCreateOrganizationModalOpen(false)
                                }}
                            >
                                {CancelMessage}
                            </Button>
                            <Button
                                type='primary'
                                htmlType='submit'
                                onClick={() => {
                                    form.submit()
                                }}
                                loading={isOrganizationCreating}
                                disabled={isRequiredFieldsEmpty || isFieldsHasError || isSearchByTinLimitReached}
                            >
                                {CreateMessage}
                            </Button>
                        </Space>
                    )}
                >
                    <Form
                        size='small'
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
                size='small'
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