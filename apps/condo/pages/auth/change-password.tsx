import {
    useAuthenticateUserWithPhoneAndPasswordMutation,
    useAuthenticateUserWithEmailAndPasswordMutation,
    useGenerateSudoTokenMutation,
    useChangeUserPasswordMutation,
} from '@app/condo/gql'
import {
    AuthenticateUserWithEmailAndPasswordSecondFactorInput,
    AuthenticateUserWithEmailAndPasswordSecondFactorType,
    AuthenticateUserWithPhoneAndPasswordSecondFactorInput,
    AuthenticateUserWithPhoneAndPasswordSecondFactorType,
    UserTypeType as UserType,
} from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'

import { ArrowLeft } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Space, Typography } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { Loader } from '@condo/domains/common/components/Loader'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PageComponentType } from '@condo/domains/common/types'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import {
    RegisterContextProvider,
    useRegisterContext,
} from '@condo/domains/user/components/auth/RegisterContextProvider'
import { useSecondFactor } from '@condo/domains/user/components/auth/SecondFactorForm'
import AuthLayout, { AuthLayoutProps } from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { useSudoToken } from '@condo/domains/user/components/SudoTokenProvider'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'
import { NOT_ENOUGH_AUTH_FACTORS } from '@condo/domains/user/constants/errors'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'
import { detectTokenTypeSafely, TOKEN_TYPES } from '@condo/domains/user/utils/tokens'

import type { FetchResult } from '@apollo/client/link/core'
import type { AuthenticateUserWithEmailAndPasswordMutation, AuthenticateUserWithPhoneAndPasswordMutation } from '@app/condo/gql'
import type { GraphQLFormattedError } from 'graphql'


const INITIAL_VALUES = {
    password: '',
}

type ChangePasswordSteps = 'getSudoTokenBeforeChangePassword' | 'changePassword' | 'authentication'

const ChangePasswordPage: PageComponentType = () => {
    const intl = useIntl()
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const CreateNewPasswordMessage = intl.formatMessage({ id: 'pages.auth.reset.CreateNewPasswordMsg' })
    const AndSignInMessage = intl.formatMessage({ id: 'pages.auth.reset.AndSignInMsg' })
    const PleaseInputYourPasswordMessage = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PasswordIsTooShortMessage = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' }, { min: MIN_PASSWORD_LENGTH })
    const PleaseConfirmYourPasswordMessage = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const TwoPasswordDontMatchMessage = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const ChangePasswordTokenErrorLabel = intl.formatMessage({ id: 'pages.auth.ChangePasswordTokenErrorLabel' })
    const ChangePasswordTokenErrorMessage = intl.formatMessage({ id: 'pages.auth.ChangePasswordTokenErrorMessage' })
    const ChangePasswordTokenErrorConfirmLabel = intl.formatMessage({ id: 'pages.auth.ChangePasswordTokenErrorConfirmLabel' })
    const SecondFactorTitle = intl.formatMessage({ id: 'component.SecondFactorForm.title' })
    const SecondFactorForAuthorizationTitle = intl.formatMessage({ id: 'component.SecondFactorForm.title.forAuthorization' })

    const router = useRouter()
    const { query: { next } } = router
    const redirectUrl = (next && !Array.isArray(next) && isSafeUrl(next)) ? next : '/'
    const { queryParams, authMethods } = useAuthMethods()

    const allowedTokenTypes = useMemo(() => [
        authMethods.phonePassword && TOKEN_TYPES.CONFIRM_PHONE,
        authMethods.emailPassword && TOKEN_TYPES.CONFIRM_EMAIL,
    ].filter(Boolean), [authMethods])

    const { executeCaptcha } = useHCaptcha()
    const { token, tokenError, identifierType, identifier } = useRegisterContext()
    const { refetch } = useAuth()
    const { getSudoTokenForce } = useSudoToken()

    const [form] = Form.useForm()

    const [step, setStep] = useState<ChangePasswordSteps>('getSudoTokenBeforeChangePassword')
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const changePasswordErrorHandler = useMutationErrorHandler({
        form,
    })

    const errorHandler = useMutationErrorHandler()
    const [authenticateUserWithPhoneAndPasswordMutation] = useAuthenticateUserWithPhoneAndPasswordMutation({
        onError: (error) => {
            if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === NOT_ENOUGH_AUTH_FACTORS)) {
                // show flow with 2FA
                // handled outside the error handler
            } else {
                errorHandler(error)
            }
        },
    })
    const [authenticateUserWithEmailAndPasswordMutation] = useAuthenticateUserWithEmailAndPasswordMutation({
        onError: (error) => {
            if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === NOT_ENOUGH_AUTH_FACTORS)) {
                // show flow with 2FA
                // handled outside the error handler
            } else {
                errorHandler(error)
            }
        },
    })
    const [generateSudoTokenMutation] = useGenerateSudoTokenMutation({
        onError: (error) => {
            if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === NOT_ENOUGH_AUTH_FACTORS)) {
                // show flow with 2FA
                // handled outside the error handler
            } else {
                errorHandler(error)
            }
        },
    })
    const [changeUserPasswordMutation] = useChangeUserPasswordMutation({
        onError: changePasswordErrorHandler,
    })

    const { requiredValidator, changeMessage, minLengthValidator } = useValidations()
    const minPasswordLengthValidator = useMemo(() => changeMessage(minLengthValidator(MIN_PASSWORD_LENGTH), PasswordIsTooShortMessage), [PasswordIsTooShortMessage, changeMessage, minLengthValidator])
    const validations = useMemo(() => ({
        password: [changeMessage(requiredValidator, PleaseInputYourPasswordMessage), minPasswordLengthValidator],
        confirmPassword: [
            changeMessage(requiredValidator, PleaseConfirmYourPasswordMessage),
            ({ getFieldValue }) => ({
                validator (_, value) {
                    if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                    }
                    return Promise.reject(TwoPasswordDontMatchMessage)
                },
            }),
        ],
    }), [PleaseConfirmYourPasswordMessage, PleaseInputYourPasswordMessage, TwoPasswordDontMatchMessage, changeMessage, minPasswordLengthValidator, requiredValidator])

    const authWithIdentifierAndPassword = useCallback(async (identifierType: string, identifier: string, password: string, secondFactorData?: { currentSecondFactor?: 'confirmEmailToken' | 'confirmPhoneToken', confirmToken: string }): Promise<void> => {
        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const commonPayload = {
                dv: 1,
                sender,
                captcha,
            }

            let res: FetchResult<AuthenticateUserWithEmailAndPasswordMutation> | FetchResult<AuthenticateUserWithPhoneAndPasswordMutation>
            if (identifierType === 'email') {
                let secondFactor: AuthenticateUserWithEmailAndPasswordSecondFactorInput = undefined
                if (secondFactorData?.currentSecondFactor === 'confirmEmailToken') {
                    secondFactor = { value: secondFactorData?.confirmToken, type: AuthenticateUserWithEmailAndPasswordSecondFactorType.ConfirmEmailToken }
                } else if (secondFactorData?.currentSecondFactor === 'confirmPhoneToken') {
                    secondFactor = { value: secondFactorData?.confirmToken, type: AuthenticateUserWithEmailAndPasswordSecondFactorType.ConfirmPhoneToken }
                }

                res = await authenticateUserWithEmailAndPasswordMutation({
                    variables: {
                        data: {
                            ...commonPayload,
                            password,
                            email: identifier,
                            userType: UserType.Staff,
                            ...(secondFactor ? { secondFactor } : null),
                        },
                    },
                })
            } else {
                let secondFactor: AuthenticateUserWithPhoneAndPasswordSecondFactorInput = undefined
                if (secondFactorData?.currentSecondFactor === 'confirmEmailToken') {
                    secondFactor = { value: secondFactorData?.confirmToken, type: AuthenticateUserWithPhoneAndPasswordSecondFactorType.ConfirmEmailToken }
                } else if (secondFactorData?.currentSecondFactor === 'confirmPhoneToken') {
                    secondFactor = { value: secondFactorData?.confirmToken, type: AuthenticateUserWithPhoneAndPasswordSecondFactorType.ConfirmPhoneToken }
                }

                res = await authenticateUserWithPhoneAndPasswordMutation({
                    variables: {
                        data: {
                            ...commonPayload,
                            password,
                            phone: identifier,
                            userType: UserType.Staff,
                            ...(secondFactor ? { secondFactor } : null),
                        },
                    },
                })
            }

            if (res.errors || !res?.data?.result?.item?.id) {
                const error: Error & { originalErrors? } = new Error('Authorization failed (request)')
                error.originalErrors = res.errors
                throw error
            }
        } catch (error) {
            console.error('Authorization failed')
            console.error(error)
            throw error
        }
    }, [authenticateUserWithEmailAndPasswordMutation, authenticateUserWithPhoneAndPasswordMutation, executeCaptcha])

    const authFactorsRef = useRef<{ confirmEmailToken?: string, confirmPhoneToken?: string }>(null)
    const sudoTokenRef = useRef<string | null>(null)
    const generateSudoToken = useCallback(async (): Promise<string> => {
        if (sudoTokenRef.current) {
            return sudoTokenRef.current
        }

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const res = await generateSudoTokenMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        authFactors: authFactorsRef.current,
                        user: {
                            userType: UserType.Staff,
                        },
                    },
                },
            })
            const sudoToken = res?.data?.result?.token

            if (res?.errors || !sudoToken) {
                const error: Error & { originalErrors? } = new Error('Failed to get sudo token (request)')
                error.originalErrors = res.errors
                throw error
            }

            sudoTokenRef.current = sudoToken
            return sudoTokenRef.current
        } catch (error) {
            console.error('Failed to get sudo token')
            console.error(error)
            throw error
        }
    }, [executeCaptcha, generateSudoTokenMutation])

    const invalidateSudoToken = useCallback(() => {
        sudoTokenRef.current = null
    }, [])

    const getSudoTokenAndChangeUserPassword = useCallback(async (password: string, withRetry: boolean = true) => {
        const sender = getClientSideSenderInfo()
        const sudoToken = await generateSudoToken()

        const res = await changeUserPasswordMutation({
            variables: {
                data: {
                    dv: 1,
                    sender,
                    token: sudoToken,
                    newPassword: password,
                },
            },
        })

        const isTokenNotFoundError = (error: GraphQLFormattedError) => error?.extensions?.type === 'TOKEN_NOT_FOUND'
        if (withRetry && res?.errors?.some(isTokenNotFoundError)) {
            invalidateSudoToken()
            return getSudoTokenAndChangeUserPassword(password, false)
        }

        return res
    }, [changeUserPasswordMutation, generateSudoToken, invalidateSudoToken])

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
    }) => {
        if (isLoading) return

        setIsLoading(true)

        try {
            const { password } = form.getFieldsValue(['password'])
            
            if (step === 'getSudoTokenBeforeChangePassword') {
                const tokenTypeInfo = detectTokenTypeSafely(token)

                if (tokenTypeInfo.error) {
                    throw tokenTypeInfo.error
                }
                if (!tokenTypeInfo.tokenType) {
                    throw new Error('Unknown token type')
                }
                if (!allowedTokenTypes.includes(tokenTypeInfo.tokenType)) {
                    throw new Error('Unsupported token type')
                }

                const authFactors: { confirmEmailToken?: string, confirmPhoneToken?: string } = {}
                if (tokenTypeInfo.tokenType === TOKEN_TYPES.CONFIRM_EMAIL) {
                    authFactors.confirmEmailToken = token
                }
                if (tokenTypeInfo.tokenType === TOKEN_TYPES.CONFIRM_PHONE) {
                    authFactors.confirmPhoneToken = token
                }
                if (currentSecondFactor === 'confirmPhoneToken' && tokenTypeInfo.tokenType !== TOKEN_TYPES.CONFIRM_PHONE) {
                    authFactors.confirmPhoneToken = confirmPhoneToken
                }
                if (currentSecondFactor === 'confirmEmailToken' && tokenTypeInfo.tokenType !== TOKEN_TYPES.CONFIRM_EMAIL) {
                    authFactors.confirmEmailToken = confirmEmailToken
                }

                authFactorsRef.current = authFactors

                await generateSudoToken()

                setCurrentSecondFactor(null)
                setAvailableSecondFactors([])
                setStep('changePassword')
            }

            if (step === 'changePassword') {
                const res = await getSudoTokenAndChangeUserPassword(password, true)

                const status = res?.data?.result?.status
                if (!res.errors && status === 'ok') {
                    invalidateSudoToken()

                    if (!identifier || !identifierType) {
                        await Router.push(`/auth/signin?next=${redirectUrl}`)
                        return
                    }

                    setStep('authentication')
                    await authWithIdentifierAndPassword(identifierType, identifier, password)
                    await refetch()

                    await getSudoTokenForce({
                        user: {
                            ...(identifierType === 'email' ? { email: identifier } : null),
                            ...(identifierType === 'phone' ? { phone: identifier } : null),
                        },
                        authFactors: {
                            password,
                        },
                    })

                    await Router.push(redirectUrl)
                    return
                }
            }

            if (step === 'authentication') {
                let secondFactor: { confirmToken: string, currentSecondFactor: 'confirmEmailToken' | 'confirmPhoneToken' } = null
                if (currentSecondFactor === 'confirmEmailToken' && confirmEmailToken) {
                    secondFactor = { confirmToken: confirmEmailToken, currentSecondFactor }
                } else if (currentSecondFactor === 'confirmPhoneToken' && confirmPhoneToken) {
                    secondFactor = { confirmToken: confirmPhoneToken, currentSecondFactor }
                }
                await authWithIdentifierAndPassword(identifierType, identifier, password, secondFactor)
                await refetch()

                if (!secondFactor) {
                    await getSudoTokenForce({
                        user: {
                            ...(identifierType === 'email' ? { email: identifier } : null),
                            ...(identifierType === 'phone' ? { phone: identifier } : null),
                        },
                        authFactors: {
                            password,
                        },
                    })
                }

                await Router.push(redirectUrl)

                return
            }
        } catch (error) {
            console.error('Change password failed')
            console.error(error)

            if (error?.originalErrors) {
                const isNotEnoughAuthFactors = (error: GraphQLFormattedError) => error?.extensions?.type === NOT_ENOUGH_AUTH_FACTORS
                // @ts-ignore
                if (error?.originalErrors?.graphQLErrors?.some(isNotEnoughAuthFactors)) {
                    // @ts-ignore
                    const graphQLError = error?.originalErrors?.graphQLErrors.find(isNotEnoughAuthFactors)
                    const authDetails = graphQLError?.extensions?.authDetails

                    if (authDetails?.is2FAEnabled && authDetails?.userId && authDetails?.availableSecondFactors?.length > 0) {
                        if (step === 'getSudoTokenBeforeChangePassword') {
                            userIdRef.current = authDetails.userId
                            const availableSecondFactors = authDetails?.availableSecondFactors?.filter(factor => ['confirmPhoneToken', 'confirmEmailToken'].includes(factor)) || []
                            const prioritySecondFactor = currentSecondFactor || availableSecondFactors?.[0] || null

                            if (availableSecondFactors.length > 0) {
                                setUserMaskedData(authDetails?.maskedData || null)
                                setAvailableSecondFactors(availableSecondFactors)
                                setCurrentSecondFactor(prioritySecondFactor)
                            }
                        } else {
                            await Router.push(`/auth/signin?next=${redirectUrl}`)
                            return
                        }
                    }

                    if (step === 'changePassword') {
                        form.resetFields(['confirmPhoneCode', 'confirmEmailCode'])
                    }

                    return
                }
            }
        } finally {
            setIsLoading(false)
        }
    }, [form, step, identifierType, identifier, authWithIdentifierAndPassword, refetch, redirectUrl, getSudoTokenForce, token, allowedTokenTypes, generateSudoToken, getSudoTokenAndChangeUserPassword, invalidateSudoToken])

    const onResetPasswordClick = useCallback(() => Router.push(`/auth/forgot?${queryParams}`), [])

    const SecondFactorHeader = useCallback(({ setCurrentSecondFactor, setAvailableSecondFactors }) => (
        <Col span={24}>
            <Row gutter={[0, 16]}>
                <Col span={24}>
                    <Space direction='vertical' size={24}>
                        <Button.Icon
                            onClick={async () => {
                                setCurrentSecondFactor(null)
                                setAvailableSecondFactors([])

                                if (step === 'changePassword') {
                                    await onResetPasswordClick()
                                } else {
                                    await Router.push(`/auth/signin?next=${redirectUrl}`)
                                }
                            }}
                            size='small'
                        >
                            <ArrowLeft />
                        </Button.Icon>
                        <Typography.Title level={2}>{step === 'authentication' ? SecondFactorForAuthorizationTitle : SecondFactorTitle}</Typography.Title>
                    </Space>
                </Col>
            </Row>
        </Col>
    ), [onResetPasswordClick, redirectUrl, step])

    const {
        currentSecondFactor,
        SecondFactorForm,
        ProblemsModal,
        onSubmitWithSecondFactor,
    } = useSecondFactor({
        isLoading,
        setIsLoading,
        form,
        onSubmit: handleSubmit,
        Header: SecondFactorHeader,
    })

    useEffect(() => {
        if (step !== 'getSudoTokenBeforeChangePassword') return

        onSubmitWithSecondFactor()
    }, [step])

    if (tokenError) {
        return (
            <Row justify='center'>
                <ResponsiveCol span={24}>
                    <Row justify='center' gutter={[0, 40]}>
                        <Col span={24}>
                            <Row gutter={[0, 16]}>
                                <Col span={24}>
                                    <Typography.Title level={2}>
                                        {ChangePasswordTokenErrorLabel}
                                    </Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Typography.Text type='secondary'>
                                        {ChangePasswordTokenErrorMessage}
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Button
                                type='primary'
                                onClick={onResetPasswordClick}
                                block
                            >
                                {ChangePasswordTokenErrorConfirmLabel}
                            </Button>
                        </Col>
                    </Row>
                </ResponsiveCol>
            </Row>
        )
    }

    return (
        <>
            {ProblemsModal}
            <Form
                form={form}
                name='change-password'
                onFinish={onSubmitWithSecondFactor}
                initialValues={INITIAL_VALUES}
                requiredMark={false}
                layout='vertical'
            >
                {SecondFactorForm}
                {
                    step === 'getSudoTokenBeforeChangePassword' && !currentSecondFactor && (
                        <Loader fill size='large' />
                    )
                }
                <Row justify='center' style={(currentSecondFactor || step !== 'changePassword') && { display: 'none' }}>
                    <ResponsiveCol span={24}>
                        <Row gutter={[0, 40]} justify='center'>
                            <Col span={24}>
                                <Typography.Title level={2}>
                                    {ResetTitle}
                                </Typography.Title>
                            </Col>

                            <Col span={24}>
                                <FormItem
                                    name='password'
                                    label={CreateNewPasswordMessage}
                                    rules={validations.password}
                                    data-cy='change-password-item'
                                >
                                    <Input.Password autoComplete='new-password'/>
                                </FormItem>
                            </Col>

                            <Col span={24}>
                                <Button
                                    key='submit'
                                    type='primary'
                                    loading={isLoading}
                                    htmlType='submit'
                                    children={`${SaveMsg} ${AndSignInMessage}`}
                                    block
                                />
                            </Col>
                        </Row>
                    </ResponsiveCol>
                </Row>
            </Form>
        </>
    )
}

const ChangePasswordLayout: React.FC<AuthLayoutProps> = ({ children, headerAction }) => {
    return (
        <AuthLayout headerAction={headerAction}>
            <RegisterContextProvider>
                {children}
            </RegisterContextProvider>
        </AuthLayout>
    )
}

ChangePasswordPage.headerAction = <></>
ChangePasswordPage.container = ChangePasswordLayout
ChangePasswordPage.skipUserPrefetch = true

export default ChangePasswordPage
