import {
    useAuthenticateUserWithPhoneAndPasswordMutation,
    useAuthenticateUserWithEmailAndPasswordMutation,
    useGenerateSudoTokenMutation,
    useChangeUserPasswordMutation,
} from '@app/condo/gql'
import { UserTypeType as UserType } from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState, useRef } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Typography } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PageComponentType } from '@condo/domains/common/types'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import {
    RegisterContextProvider,
    useRegisterContext,
} from '@condo/domains/user/components/auth/RegisterContextProvider'
import AuthLayout, { AuthLayoutProps } from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'
import { detectTokenTypeSafely, TOKEN_TYPES } from '@condo/domains/user/utils/tokens'

import type { FetchResult } from '@apollo/client/link/core'
import type { AuthenticateUserWithEmailAndPasswordMutation, AuthenticateUserWithPhoneAndPasswordMutation } from '@app/condo/gql'
import type { GraphQLFormattedError } from 'graphql'


const INITIAL_VALUES = {
    password: '',
}


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

    const [form] = Form.useForm()

    const [isLoading, setIsLoading] = useState<boolean>(false)

    const changePasswordErrorHandler = useMutationErrorHandler({
        form,
    })

    const errorHandler = useMutationErrorHandler()
    const [authenticateUserWithPhoneAndPasswordMutation] = useAuthenticateUserWithPhoneAndPasswordMutation({
        onError: errorHandler,
    })
    const [authenticateUserWithEmailAndPasswordMutation] = useAuthenticateUserWithEmailAndPasswordMutation({
        onError: errorHandler,
    })
    const [generateSudoTokenMutation] = useGenerateSudoTokenMutation({
        onError: errorHandler,
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

    const authWithIdentifierAndPassword = useCallback(async (identifierType: string, identifier: string, password: string): Promise<void> => {
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
                res = await authenticateUserWithEmailAndPasswordMutation({
                    variables: {
                        data: {
                            ...commonPayload,
                            password,
                            email: identifier,
                            userType: UserType.Staff,
                        },
                    },
                })
            } else {
                res = await authenticateUserWithPhoneAndPasswordMutation({
                    variables: {
                        data: {
                            ...commonPayload,
                            password,
                            phone: identifier,
                            userType: UserType.Staff,
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

    const sudoTokenRef = useRef<string | null>(null)
    const generateSudoToken = useCallback(async (confirmToken: string): Promise<string> => {
        if (sudoTokenRef.current) {
            return sudoTokenRef.current
        }

        try {
            const tokenTypeInfo = detectTokenTypeSafely(confirmToken)

            if (tokenTypeInfo.error) {
                throw tokenTypeInfo.error
            }
            if (!tokenTypeInfo.tokenType) {
                throw new Error('Unknown token type')
            }
            if (!allowedTokenTypes.includes(tokenTypeInfo.tokenType)) {
                throw new Error('Unsupported token type')
            }

            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const res = await generateSudoTokenMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        authFactors: {
                            [tokenTypeInfo.tokenType === TOKEN_TYPES.CONFIRM_EMAIL ? 'confirmEmailToken' : 'confirmPhoneToken']: confirmToken,
                        },
                        user: {
                            userType: UserType.Staff,
                            ...(identifier ? { [tokenTypeInfo.tokenType === TOKEN_TYPES.CONFIRM_EMAIL ? 'email' : 'phone']: identifier } : null),
                        },
                    },
                },
            })
            const sudoToken = res?.data?.result?.token

            if (res.errors || !sudoToken) {
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
    }, [allowedTokenTypes, executeCaptcha, generateSudoTokenMutation, identifier])

    const invalidateSudoToken = useCallback(() => {
        sudoTokenRef.current = null
    }, [])

    const changeUserPassword = useCallback(async (confirmToken: string, password: string, withRetry: boolean = true) => {
        const sender = getClientSideSenderInfo()
        const sudoToken = await generateSudoToken(confirmToken)

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
            return changeUserPassword(confirmToken, password, false)
        }

        return res
    }, [changeUserPasswordMutation, generateSudoToken, invalidateSudoToken])

    const onSubmit = useCallback(async (values: typeof INITIAL_VALUES) => {
        if (isLoading) return

        setIsLoading(true)

        try {
            const { password } = values
            const res = await changeUserPassword(token, password, true)

            const status = res?.data?.result?.status
            if (!res.errors && status === 'ok') {
                invalidateSudoToken()

                if (!identifier || !identifierType) {
                    await Router.push(`/auth/signin?next=${redirectUrl}`)
                    return
                }

                await authWithIdentifierAndPassword(identifierType, identifier, password)
                await refetch()
                await Router.push(redirectUrl)
            }
        } catch (error) {
            console.error('Change password failed')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [authWithIdentifierAndPassword, changeUserPassword, identifier, identifierType, invalidateSudoToken, isLoading, redirectUrl, token])

    const onResetPasswordClick = useCallback(() => Router.push(`/auth/forgot?${queryParams}`), [])

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
        <Form
            form={form}
            name='change-password'
            onFinish={onSubmit}
            initialValues={INITIAL_VALUES}
            requiredMark={false}
            layout='vertical'
        >
            <Row justify='center'>
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
