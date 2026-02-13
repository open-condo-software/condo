import {
    useCheckUserExistenceLazyQuery,
    useAuthenticateOrRegisterUserWithTokenMutation,
    useStartConfirmEmailActionMutation,
} from '@app/condo/gql'
import {
    ConfirmEmailActionMessageType,
    UserTypeType as UserType,
    AuthenticateOrRegisterUserWithTokenSecondFactorType,
    AuthenticateOrRegisterUserWithTokenSecondFactorInput,
} from '@app/condo/schema'
import { Col, Form, Row, notification } from 'antd'
import { ValidateStatus } from 'antd/lib/form/FormItem'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useState, useMemo } from 'react'

import { ArrowLeft } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Input, Space, Checkbox } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { Loader } from '@condo/domains/common/components/Loader'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { analytics } from '@condo/domains/common/utils/analytics'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { RequiredFlagWrapper } from '@condo/domains/user/components/containers/styles'
import { useSudoToken } from '@condo/domains/user/components/SudoTokenProvider'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'
import { EMAIL_ALREADY_REGISTERED_ERROR, NOT_ENOUGH_AUTH_FACTORS } from '@condo/domains/user/constants/errors'

import { useRegisterFormValidators } from './hooks'
import { useRegisterContext } from './RegisterContextProvider'
import { useSecondFactor } from './SecondFactorForm'

import type { FormRule as Rule } from 'antd'
import type { GraphQLFormattedError } from 'graphql'


type ValidatorsMap = {
    [key: string]: Rule[]
}

type RegisterFormProps = {
    onFinish: () => Promise<void>
    onReset: () => void
}


const { publicRuntimeConfig: { defaultLocale, inviteRequiredFields } } = getConfig()

const isEmailRequired = Array.isArray(inviteRequiredFields) && inviteRequiredFields.includes('email')
const isPhoneRequired = Array.isArray(inviteRequiredFields) && inviteRequiredFields.includes('phone')

export const RegisterForm: React.FC<RegisterFormProps> = ({ onReset, onFinish }) => {
    const intl = useIntl()
    const RegisterMessage = intl.formatMessage({ id: 'Register' })
    const ExampleNameMessage = intl.formatMessage({ id: 'example.Name' })
    const EmailPlaceholder = intl.formatMessage({ id: 'example.Email' })
    const PhonePlaceholder = intl.formatMessage({ id: 'example.Phone' })
    const NameMessage = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.register.field.Password' })
    const EmailMessage = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const PhoneMessage = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const RegistrationTitle = intl.formatMessage({ id: 'pages.auth.register.step.register.title' })
    const EnterPasswordTitle = intl.formatMessage({ id: 'pages.auth.register.step.register.title.createPassword' })
    const RegisterFailMessage = intl.formatMessage({ id: 'pages.auth.register.fail' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' }, { min: MIN_PASSWORD_LENGTH })
    const ConsentToReceiveMarketingMaterialsMessage = intl.formatMessage({ id: 'common.consentToReceiveMarketingMaterials' })
    const OperationCompleted = intl.formatMessage({ id: 'OperationCompleted' })
    const SecondFactorForAuthorizationTitle = intl.formatMessage({ id: 'component.SecondFactorForm.title.forAuthorization' })

    const { executeCaptcha } = useHCaptcha()
    const { identifier, identifierType, token } = useRegisterContext()
    const { refetch } = useAuth()
    const { getSudoTokenForce } = useSudoToken()

    const [form] = Form.useForm()

    const [passwordValidateStatus, setPasswordValidateStatus] = useState<ValidateStatus>()
    const [passwordHelp, setPasswordHelp] = useState<string>('')

    const commonValidators = useRegisterFormValidators()

    const validators: ValidatorsMap = useMemo(() => ({
        name: commonValidators.name,
        phone: [{ required: isPhoneRequired }],
        email: [{ required: isEmailRequired }, ...commonValidators.email],
        password: commonValidators.password,
    }), [commonValidators])

    /**
     * 1) Check if user exists
     * 2.1) If the user is registered and has all the required data, then we simply authorize him
     * 2.2) If the user is not registered, then we show the full registration form and register
     * 2.3) If the user is registered, but does not have all the required data,
     *      then we show a shortened registration form and finish a registration
     */
    const [step, setStep] = useState<'checkUser' | 'authenticate' | 'authenticate2FA' | 'register'>('checkUser')
    const [isLoading, setIsLoading] = useState(false)

    const errorHandler = useMutationErrorHandler()
    const [checkUserExistenceQuery, userExistenceResult] = useCheckUserExistenceLazyQuery({
        onError: errorHandler,
    })

    const [startConfirmEmailActionMutation] = useStartConfirmEmailActionMutation({
        onError: errorHandler,
    })

    const authOrRegisterErrorHandler = useMutationErrorHandler({
        form,
        constraintToMessageMapping: {
            [EMAIL_ALREADY_REGISTERED_ERROR]: 'email',
        },
    })
    const [authOrRegisterUserWithTokenMutation, authOrRegisterUserWithTokenResult] = useAuthenticateOrRegisterUserWithTokenMutation({
        onError: (error) => {
            if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === NOT_ENOUGH_AUTH_FACTORS)) {
                // show flow with 2FA
                // handled outside the error handler
            } else {
                authOrRegisterErrorHandler(error)
            }
        },
    })

    const visibleFields = useMemo(() => ({
        name: !userExistenceResult?.data?.result?.isNameSet,
        email: identifierType === 'phone' && !userExistenceResult?.data?.result?.isUserExists,
        hasMarketingConsent: ['phone', 'email'].includes(identifierType) && !userExistenceResult?.data?.result?.isUserExists,
        phone: identifierType === 'email' && !userExistenceResult?.data?.result?.isUserExists,
        password: !userExistenceResult?.data?.result?.isPasswordSet,
    }), [identifierType, userExistenceResult?.data])
    const visiblePasswordOnly = !visibleFields.name
        && (identifierType === 'email' ? !visibleFields.phone : !visibleFields.email)
        && visibleFields.password

    const checkUserExistence = useCallback(async () => {
        if (isLoading) return

        try {
            setIsLoading(true)

            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()

            const res = await checkUserExistenceQuery({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        token,
                        userType: UserType.Staff,
                    },
                },
            })

            const result = res?.data?.result
            if (!res.error && result) {
                const isIdentifierSet = identifierType === 'email' ? result.isEmailSet : result.isPhoneSet
                if (result.isUserExists && result.isNameSet && result.isPasswordSet && isIdentifierSet) {
                    setStep('authenticate')
                } else {
                    setStep('register')
                    if (!result.isUserExists) {
                        const eventName = identifierType === 'email' ? 'confirm_email_registration' : 'confirm_phone_registration'
                        analytics.track(eventName, {})
                    }
                }
            }
        } catch (error) {
            console.error('Check user existence failed')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [checkUserExistenceQuery, executeCaptcha, isLoading, token])

    const startConfirmEmailAction = useCallback(async (email) => {
        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()

            const res = await startConfirmEmailActionMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        email,
                        messageType: ConfirmEmailActionMessageType.VerifyUserEmail,
                    },
                },
            })

            if (res?.data?.result?.token) {
                notification.success({
                    message: OperationCompleted,
                    description: intl.formatMessage({ id: 'pages.user.index.alert.verifyEmail.notification' }, { email }),
                })
            }
        } catch (error) {
            console.log('Cannot start a user email verifying')
        }
    }, [])

    const SecondFactorHeader = useCallback(({ setCurrentSecondFactor, setAvailableSecondFactors }) => (
        <Col span={24}>
            <Row gutter={[0, 16]}>
                <Col span={24}>
                    <Space direction='vertical' size={24}>
                        <Button.Icon
                            onClick={() => {
                                setCurrentSecondFactor(null)
                                setAvailableSecondFactors([])
                                onReset()
                            }}
                            size='small'
                        >
                            <ArrowLeft />
                        </Button.Icon>
                        <Typography.Title level={2}>{SecondFactorForAuthorizationTitle}</Typography.Title>
                    </Space>
                </Col>
            </Row>
        </Col>
    ), [onReset])

    const handleSubmit = useCallback(async ({
        isLoading,
        setIsLoading,
        userIdRef,
        setUserMaskedData,
        setAvailableSecondFactors,
        setCurrentSecondFactor,
        currentSecondFactor,
        confirmEmailToken,
        confirmPhoneToken,
        password: passwordAs2FA,
    }) => {
        if (isLoading) return

        try {
            setIsLoading(true)

            const {
                name,
                email: inputEmail,
                phone: inputPhone,
                password,
                hasMarketingConsent,
            } = form.getFieldsValue(['name', 'email', 'phone', 'password', 'hasMarketingConsent'])
            const email = inputEmail ? inputEmail.toLowerCase().trim() : ''
            const phone = inputPhone ? inputPhone.toLowerCase().trim() : ''

            const userData = {
                ...(visibleFields.email ? { email } : null),
                ...(visibleFields.phone ? { phone } : null),
                ...(visibleFields.name ? { name } : null),
                ...(visibleFields.password ? { password } : null),
                ...(email && visibleFields.hasMarketingConsent ? { hasMarketingConsent } : null),
            }

            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()

            let secondFactor: AuthenticateOrRegisterUserWithTokenSecondFactorInput = undefined
            if (currentSecondFactor === 'confirmEmailToken') {
                secondFactor = { value: confirmEmailToken, type: AuthenticateOrRegisterUserWithTokenSecondFactorType.ConfirmEmailToken }
            } else if (currentSecondFactor === 'confirmPhoneToken') {
                secondFactor = { value: confirmPhoneToken, type: AuthenticateOrRegisterUserWithTokenSecondFactorType.ConfirmPhoneToken }
            } else if (currentSecondFactor === 'password') {
                secondFactor = { value: passwordAs2FA, type: AuthenticateOrRegisterUserWithTokenSecondFactorType.Password }
            }

            const res = await authOrRegisterUserWithTokenMutation({
                variables: {
                    data: {
                        dv:1,
                        sender,
                        captcha,
                        userType: UserType.Staff,
                        token,
                        ...(secondFactor ? { secondFactor } : null),
                        ...(Object.keys(userData).length > 0 ? { userData } : null),
                    },
                },
            })

            const isNotEnoughAuthFactors = (error: GraphQLFormattedError) => error?.extensions?.type === NOT_ENOUGH_AUTH_FACTORS
            // @ts-ignore
            if (res?.errors?.graphQLErrors?.some(isNotEnoughAuthFactors)) {
                // @ts-ignore
                const graphQLError = res?.errors?.graphQLErrors.find(isNotEnoughAuthFactors)
                const authDetails = graphQLError?.extensions?.authDetails

                if (authDetails?.is2FAEnabled && authDetails?.userId && authDetails?.availableSecondFactors?.length > 0) {
                    userIdRef.current = authDetails.userId
                    const availableSecondFactors = authDetails?.availableSecondFactors?.filter(factor => ['confirmPhoneToken', 'confirmEmailToken', 'password'].includes(factor)) || []
                    const prioritySecondFactor = currentSecondFactor || availableSecondFactors?.[0] || null

                    if (availableSecondFactors.length > 0) {
                        setUserMaskedData(authDetails?.maskedData || null)
                        setAvailableSecondFactors(availableSecondFactors)
                        setCurrentSecondFactor(prioritySecondFactor)
                        setStep('authenticate2FA')
                    }
                }

                return
            }

            const userId = res?.data?.result?.user?.id
            if (!res.errors && userId) {
                if (step === 'register' && !userExistenceResult?.data?.result?.isUserExists) {
                    analytics.track('register_user', { userId })

                    if (userData?.email) {
                        await startConfirmEmailAction(userData.email)
                    }
                }

                await refetch()

                if (userData.password) {
                    await getSudoTokenForce({
                        user: {
                            ...(identifierType === 'email' ? { email: identifier } : null),
                            ...(identifierType === 'phone' ? { phone: identifier } : null),
                        },
                        authFactors: {
                            password: userData.password,
                        },
                    })
                }

                await onFinish()
                return
            }
        } catch (error) {
            console.error('Register failed')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [authOrRegisterUserWithTokenMutation, executeCaptcha, form, getSudoTokenForce, identifier, identifierType, onFinish, refetch, startConfirmEmailAction, step, token, userExistenceResult?.data?.result?.isUserExists, visibleFields.email, visibleFields.hasMarketingConsent, visibleFields.name, visibleFields.password, visibleFields.phone])

    const [secondFactorForm] = Form.useForm()
    const {
        onSubmitWithSecondFactor: authenticateOrRegister,
        ProblemsModal,
        SecondFactorForm,
    } = useSecondFactor({
        form: secondFactorForm,
        Header: SecondFactorHeader,
        onSubmit: handleSubmit,
        isLoading,
        setIsLoading,
    })

    useEffect(() => {
        if (step !== 'checkUser') return

        checkUserExistence()
    }, [])

    useEffect(() => {
        if (isLoading) return
        if (step !== 'authenticate') return
        if (authOrRegisterUserWithTokenResult.loading) return
        if (authOrRegisterUserWithTokenResult.called) return

        const result = userExistenceResult?.data?.result
        const canSkipRegistration = !userExistenceResult?.error
            && result?.isUserExists
            && (identifierType === 'email' ? result?.isEmailSet : result?.isPhoneSet)
            && result?.isPasswordSet
            && result?.isNameSet
        if (!canSkipRegistration) return

        authenticateOrRegister()
    }, [step, userExistenceResult?.data, isLoading])

    const initialValues = useMemo(() => ({
        [identifierType === 'email' ? 'email' : 'phone']: identifier,
    }), [identifier, identifierType])

    if (step === 'checkUser' || step === 'authenticate') {
        if (userExistenceResult.error || authOrRegisterUserWithTokenResult.error) {
            return (
                <Row justify='center'>
                    <ResponsiveCol span={24}>
                        <Row gutter={[0, 40]} justify='center'>
                            <Col span={24}>
                                <Space direction='vertical' size={24}>
                                    <Button.Icon onClick={onReset} size='small'>
                                        <ArrowLeft />
                                    </Button.Icon>
                                    <Typography.Title level={2}>{RegistrationTitle}</Typography.Title>
                                </Space>
                            </Col>

                            <Col span={24}>
                                <Typography.Text>{RegisterFailMessage}</Typography.Text>
                            </Col>
                        </Row>
                    </ResponsiveCol>
                </Row>
            )
        }

        return (
            <Loader />
        )
    }

    if (step === 'authenticate2FA') {
        return (
            <>
                <Form
                    form={secondFactorForm}
                    name='2FA'
                    onFinish={authenticateOrRegister}
                    initialValues={identifierType === 'email' ? { confirmEmailToken: token } : { confirmPhoneToken: token }}
                    requiredMark={false}
                    layout='vertical'
                >
                    {SecondFactorForm}
                </Form>

                {ProblemsModal}
            </>
        )
    }

    return (
        <Form
            form={form}
            name='register'
            onFinish={authenticateOrRegister}
            initialValues={initialValues}
            colon={false}
            requiredMark={true}
            layout='vertical'
            validateTrigger={['onBlur', 'onSubmit']}
        >
            <Row justify='center'>
                <ResponsiveCol span={24}>
                    <Row gutter={[0, 40]} justify='center'>
                        <Col span={24}>
                            <Space direction='vertical' size={24}>
                                <Button.Icon onClick={onReset} size='small'>
                                    <ArrowLeft />
                                </Button.Icon>
                                <Typography.Title level={2}>{visiblePasswordOnly ? EnterPasswordTitle : RegistrationTitle}</Typography.Title>
                            </Space>
                        </Col>

                        <Col span={24}>
                            <Row gutter={[0, 24]}>
                                {
                                    visibleFields.name && (
                                        <Col span={24}>
                                            <RequiredFlagWrapper>
                                                <FormItem
                                                    name='name'
                                                    label={NameMessage}
                                                    rules={validators.name}
                                                    data-cy='register-name-item'
                                                    validateFirst
                                                >
                                                    <Input
                                                        placeholder={ExampleNameMessage}
                                                        tabIndex={1}
                                                        autoFocus
                                                    />
                                                </FormItem>
                                            </RequiredFlagWrapper>
                                        </Col>
                                    )
                                }

                                {
                                    visibleFields.email && (
                                        <Col span={24}>
                                            <RequiredFlagWrapper>
                                                <FormItem
                                                    name='email'
                                                    label={EmailMessage}
                                                    rules={validators.email}
                                                    data-cy='register-email-item'
                                                    validateFirst
                                                    required={isEmailRequired}
                                                >
                                                    <Input
                                                        autoComplete='chrome-off'
                                                        placeholder={EmailPlaceholder}
                                                        tabIndex={2}
                                                        autoFocus={!visibleFields.name}
                                                    />
                                                </FormItem>
                                            </RequiredFlagWrapper>
                                        </Col>
                                    )
                                }

                                {
                                    visibleFields.phone && (
                                        <Col span={24}>
                                            <RequiredFlagWrapper>
                                                <FormItem
                                                    name='phone'
                                                    label={PhoneMessage}
                                                    rules={validators.phone}
                                                    data-cy='register-phone-item'
                                                    validateFirst
                                                    required={isPhoneRequired}
                                                >
                                                    <Input.Phone
                                                        country={defaultLocale}
                                                        placeholder={PhonePlaceholder}
                                                        inputProps={{
                                                            tabIndex: 2,
                                                            autoComplete: 'chrome-off',
                                                            autoFocus: !visibleFields.name && !visibleFields.email,
                                                        }}
                                                    />
                                                </FormItem>
                                            </RequiredFlagWrapper>
                                        </Col>
                                    )
                                }

                                {
                                    visibleFields.hasMarketingConsent && visibleFields.email && (
                                        <Col span={24}>
                                            <Form.Item noStyle shouldUpdate>
                                                {
                                                    ({ getFieldsValue }) => {
                                                        const { email: emailFromForm } = getFieldsValue(['email'])
                                                        const email = emailFromForm?.trim()

                                                        return (
                                                            <Form.Item noStyle name='hasMarketingConsent' valuePropName='checked' label={null}>
                                                                <Checkbox tabIndex={4} disabled={!email}>
                                                                    <Typography.Text size='small'>
                                                                        {ConsentToReceiveMarketingMaterialsMessage}
                                                                    </Typography.Text>
                                                                </Checkbox>
                                                            </Form.Item>
                                                        )
                                                    }
                                                }
                                            </Form.Item>
                                        </Col>
                                    )
                                }

                                {
                                    visibleFields.password && (
                                        <Col span={24}>
                                            <RequiredFlagWrapper>
                                                <FormItem
                                                    name='password'
                                                    label={PasswordMessage}
                                                    rules={validators.password}
                                                    data-cy='register-password-item'
                                                    validateFirst
                                                    validateStatus={passwordValidateStatus}
                                                    help={passwordHelp}
                                                >
                                                    <Input.Password
                                                        autoComplete='new-password'
                                                        tabIndex={3}
                                                        autoFocus={!visibleFields.name && !visibleFields.email && !visibleFields.phone}
                                                    />
                                                </FormItem>
                                                <FormItem noStyle shouldUpdate>
                                                    {
                                                        ({ getFieldError, getFieldValue, isFieldTouched, isFieldValidating }) => {
                                                            const passwordError = getFieldError('password')
                                                            const passwordValue = getFieldValue('password') || ''

                                                            const passwordHelp = passwordError.length
                                                                ? passwordError[0]
                                                                : passwordValue?.length < MIN_PASSWORD_LENGTH
                                                                    ? PasswordIsTooShortMsg
                                                                    : ''
                                                            setPasswordHelp(passwordHelp)
                                                            setPasswordValidateStatus(passwordError.length ? 'error' : '')
                                                            return null
                                                        }
                                                    }
                                                </FormItem>
                                            </RequiredFlagWrapper>
                                        </Col>
                                    )
                                }
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Button
                                key='submit'
                                type='primary'
                                htmlType='submit'
                                loading={isLoading}
                                block
                                data-cy='registercomplete-button'
                                tabIndex={4}
                            >
                                {RegisterMessage}
                            </Button>
                        </Col>
                    </Row>
                </ResponsiveCol>
            </Row>
        </Form>
    )
}
