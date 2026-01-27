import {
    useAuthenticateUserWithPhoneAndPasswordMutation,
    useAuthenticateUserWithEmailAndPasswordMutation,
} from '@app/condo/gql'
import {
    UserTypeType as UserType,
    AuthenticateUserWithEmailAndPasswordSecondFactorType,
    AuthenticateUserWithPhoneAndPasswordSecondFactorType,
    AuthenticateUserWithEmailAndPasswordSecondFactorInput,
    AuthenticateUserWithPhoneAndPasswordSecondFactorInput,
} from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useState, useMemo, useEffect } from 'react'

import { ArrowLeft } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Input, Space } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { TabsAuthAction } from '@condo/domains/common/components/HeaderActions'
import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { useSudoToken } from '@condo/domains/user/components/SudoTokenProvider'
import { NOT_ENOUGH_AUTH_FACTORS, WRONG_CREDENTIALS } from '@condo/domains/user/constants/errors'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'
import { normalizeUserIdentifier } from '@condo/domains/user/utils/helpers'

import { AgreementText } from './AgreementText'
import { useSecondFactor } from './SecondFactorForm'

import type { FetchResult } from '@apollo/client/link/core'
import type { AuthenticateUserWithPhoneAndPasswordMutation, AuthenticateUserWithEmailAndPasswordMutation } from '@app/condo/gql'
import type { GraphQLFormattedError } from 'graphql'


const { publicRuntimeConfig: { hasSbbolAuth, defaultLocale } } = getConfig()

const INITIAL_VALUES = { password: '', identifier: '' }
const IDENTIFIER_INPUT_PROPS = { tabIndex: 1, autoFocus: true }
const TAB_INDEXES = { termsOfUse: 7, consentLink: 9, privacyPolicyLink: 8 }

export const SignInForm = (): React.ReactElement => {
    const intl = useIntl()
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const PhoneMessage = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const EmailMessage = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const PhoneOrEmailMessage = intl.formatMessage({ id: 'pages.auth.register.field.PhoneOrEmail' })
    const ResetPasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.ResetPasswordLink' })
    const SecondFactorForAuthorizationTitle = intl.formatMessage({ id: 'component.SecondFactorForm.title.forAuthorization' })

    const router = useRouter()

    const { authMethods } = useAuthMethods()

    const { refetch } = useAuth()
    const { executeCaptcha } = useHCaptcha()
    const { getSudoTokenForce } = useSudoToken()

    const [form] = Form.useForm()

    const [isLoading, setIsLoading] = useState(false)

    const { query: { next }  } = router

    const redirectUrl = (next && !Array.isArray(next) && isSafeUrl(next)) ? next : '/'

    const errorHandler = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [WRONG_CREDENTIALS]: 'identifier',
        },
    })
    const [authenticateUserWithPhoneAndPassword] = useAuthenticateUserWithPhoneAndPasswordMutation({
        onError: (error) => {
            if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === NOT_ENOUGH_AUTH_FACTORS)) {
                // show flow with 2FA
                // handled outside the error handler
            } else {
                errorHandler(error)
            }
        },
    })
    const [authenticateUserWithEmailAndPassword] = useAuthenticateUserWithEmailAndPasswordMutation({
        onError: (error) => {
            if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === NOT_ENOUGH_AUTH_FACTORS)) {
                // show flow with 2FA
                // handled outside the error handler
            } else {
                errorHandler(error)
            }
        },
    })

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
    }): Promise<void> => {
        if (isLoading) return

        setIsLoading(true)

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const commonPayload = {
                dv: 1,
                sender,
                captcha,
            }

            const {
                identifier, password,
            } = form.getFieldsValue(['identifier', 'password'])

            const identifierType = normalizeUserIdentifier(identifier).type

            let res: FetchResult<AuthenticateUserWithEmailAndPasswordMutation> | FetchResult<AuthenticateUserWithPhoneAndPasswordMutation>
            if (identifierType === 'email') {
                let secondFactor: AuthenticateUserWithEmailAndPasswordSecondFactorInput = undefined
                if (currentSecondFactor === 'confirmEmailToken') {
                    secondFactor = { value: confirmEmailToken, type: AuthenticateUserWithEmailAndPasswordSecondFactorType.ConfirmEmailToken }
                } else if (currentSecondFactor === 'confirmPhoneToken') {
                    secondFactor = { value: confirmPhoneToken, type: AuthenticateUserWithEmailAndPasswordSecondFactorType.ConfirmPhoneToken }
                }

                res = await authenticateUserWithEmailAndPassword({
                    variables: {
                        data: {
                            ...commonPayload,
                            email: identifier,
                            password: password,
                            userType: UserType.Staff,
                            ...(secondFactor ? ({ secondFactor }) : null),
                        },
                    },
                })
            } else {
                let secondFactor: AuthenticateUserWithPhoneAndPasswordSecondFactorInput = undefined
                if (currentSecondFactor === 'confirmEmailToken') {
                    secondFactor = { value: confirmEmailToken, type: AuthenticateUserWithPhoneAndPasswordSecondFactorType.ConfirmEmailToken }
                } else if (currentSecondFactor === 'confirmPhoneToken') {
                    secondFactor = { value: confirmPhoneToken, type: AuthenticateUserWithPhoneAndPasswordSecondFactorType.ConfirmPhoneToken }
                }

                res = await authenticateUserWithPhoneAndPassword({
                    variables: {
                        data: {
                            ...commonPayload,
                            phone: identifier,
                            password: password,
                            userType: UserType.Staff,
                            ...(secondFactor ? ({ secondFactor }) : null),
                        },
                    },
                })
            }

            const isNotEnoughAuthFactors = (error: GraphQLFormattedError) => error?.extensions?.type === NOT_ENOUGH_AUTH_FACTORS
            // @ts-ignore
            if (res?.errors?.graphQLErrors?.some(isNotEnoughAuthFactors)) {
                // @ts-ignore
                const graphQLError = res?.errors?.graphQLErrors.find(isNotEnoughAuthFactors)
                const authDetails = graphQLError?.extensions?.authDetails

                if (authDetails?.is2FAEnabled && authDetails?.userId && authDetails?.availableSecondFactors?.length > 0) {
                    userIdRef.current = authDetails.userId
                    const availableSecondFactors = authDetails?.availableSecondFactors?.filter(factor => ['confirmPhoneToken', 'confirmEmailToken'].includes(factor)) || []
                    const prioritySecondFactor = currentSecondFactor || availableSecondFactors?.[0] || null

                    if (availableSecondFactors.length > 0) {
                        setUserMaskedData(authDetails?.maskedData || null)
                        setAvailableSecondFactors(availableSecondFactors)
                        setCurrentSecondFactor(prioritySecondFactor)
                    }
                }

                return
            }

            if (!res.errors && res.data?.result?.item?.id) {
                await refetch()

                if (!confirmPhoneToken && !confirmEmailToken) {
                    // NOTE: We can get a sudo token without confirmation only if 2FA is disabled
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

                await router.push(redirectUrl)
                return
            }
        } catch (error) {
            console.error('Authorization failed')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [executeCaptcha, form, authenticateUserWithEmailAndPassword, authenticateUserWithPhoneAndPassword, refetch, router, redirectUrl, getSudoTokenForce])

    const SecondFactorHeader = useCallback(({ setCurrentSecondFactor, setAvailableSecondFactors }) => (
        <Col span={24}>
            <Row gutter={[0, 16]}>
                <Col span={24}>
                    <Space direction='vertical' size={24}>
                        <Button.Icon
                            onClick={() => {
                                setCurrentSecondFactor(null)
                                setAvailableSecondFactors([])
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
    ), [SecondFactorForAuthorizationTitle])

    const {
        onSubmitWithSecondFactor,
        ProblemsModal,
        SecondFactorForm: SecondFactorAuthenticationStep,
        currentSecondFactor,
    } = useSecondFactor({
        form,
        Header: SecondFactorHeader,
        onSubmit: handleSubmit,
        isLoading,
        setIsLoading,
    })

    useEffect(() => {
        if (currentSecondFactor) {
            updateQuery(router, { newParameters: { 'authStep': 'secondFactor' } }, { resetOldParameters: false, routerAction: 'replace' })
        } else {
            updateQuery(router, { newParameters: { 'authStep': 'firstFactor' } }, { resetOldParameters: false, routerAction: 'replace' })
        }
    }, [currentSecondFactor])

    const FirstFactorAuthenticationStep = useMemo(() => (
        <Row style={!!currentSecondFactor && { display: 'none' }}>
            <Col span={24}>
                {
                    (authMethods.phonePassword || authMethods.emailPassword) && (
                        <Row justify='center'>
                            <Col>
                                <TabsAuthAction currentActiveKey='signin'/>
                            </Col>
                        </Row>
                    )
                }

                <Row justify='start'>
                    <ResponsiveCol span={24}>
                        <Row gutter={[0, 40]}>
                            {
                                (authMethods.phonePassword || authMethods.emailPassword) && (
                                    <Col span={24}>
                                        <Row gutter={[0, 24]}>
                                            <Col span={24}>
                                                {
                                                    authMethods.phonePassword && !authMethods.emailPassword && (
                                                        <FormItem
                                                            name='identifier'
                                                            label={PhoneMessage}
                                                            rules={[{ required: true, message: FieldIsRequiredMessage }]}
                                                            data-cy='signin-identifier-item'
                                                        >
                                                            <Input.Phone country={defaultLocale} placeholder={ExamplePhoneMessage} inputProps={IDENTIFIER_INPUT_PROPS} />
                                                        </FormItem>
                                                    )
                                                }
                                                {
                                                    !authMethods.phonePassword && authMethods.emailPassword && (
                                                        <FormItem
                                                            name='identifier'
                                                            label={EmailMessage}
                                                            rules={[{ required: true, message: FieldIsRequiredMessage }]}
                                                            data-cy='signin-identifier-item'
                                                        >
                                                            <Input placeholder={ExampleEmailMessage} {...IDENTIFIER_INPUT_PROPS} />
                                                        </FormItem>
                                                    )
                                                }
                                                {
                                                    authMethods.phonePassword && authMethods.emailPassword && (
                                                        <FormItem
                                                            name='identifier'
                                                            label={PhoneOrEmailMessage}
                                                            rules={[{ required: true, message: FieldIsRequiredMessage }]}
                                                            data-cy='signin-identifier-item'
                                                        >
                                                            <Input {...IDENTIFIER_INPUT_PROPS} />
                                                        </FormItem>
                                                    )
                                                }
                                            </Col>
                                            <Col span={24}>
                                                <Row gutter={[0, 24]}>
                                                    <Col span={24}>
                                                        <FormItem
                                                            name='password'
                                                            label={PasswordMessage}
                                                            rules={[{ required: true, message: FieldIsRequiredMessage }]}
                                                            data-cy='signin-password-item'
                                                        >
                                                            <Input.Password tabIndex={2} />
                                                        </FormItem>
                                                    </Col>

                                                    <Col span={24}>
                                                        <Typography.Link component={Link} href={`/auth/forgot?next=${encodeURIComponent(redirectUrl)}`} tabIndex={3}>
                                                            {ResetPasswordMessage}
                                                        </Typography.Link>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Col>
                                )
                            }

                            <Col span={24}>
                                <Row gutter={[0, 24]}>

                                    {
                                        (authMethods.phonePassword || authMethods.emailPassword) && (
                                            <Col span={24}>
                                                <Button
                                                    key='submit'
                                                    type='primary'
                                                    htmlType='submit'
                                                    loading={isLoading}
                                                    block
                                                    data-cy='signin-button'
                                                    tabIndex={4}
                                                >
                                                    {SignInMessage}
                                                </Button>
                                            </Col>
                                        )
                                    }

                                    {
                                        hasSbbolAuth && authMethods.sbbolid && (
                                            <Col span={24} id='signInSBBOL'>
                                                <LoginWithSBBOLButton
                                                    tabIndex={5}
                                                    redirect={redirectUrl}
                                                    block
                                                    checkTlsCert
                                                />
                                            </Col>
                                        )
                                    }

                                    <AgreementText tabIndexes={TAB_INDEXES} />
                                </Row>
                            </Col>
                        </Row>
                    </ResponsiveCol>
                </Row>
            </Col>
        </Row>
    ), [EmailMessage, ExampleEmailMessage, ExamplePhoneMessage, FieldIsRequiredMessage, PasswordMessage, PhoneMessage, PhoneOrEmailMessage, ResetPasswordMessage, SignInMessage, authMethods.emailPassword, authMethods.phonePassword, authMethods.sbbolid, currentSecondFactor, isLoading, redirectUrl])

    return (
        <>
            <Form
                form={form}
                name='signin'
                onFinish={onSubmitWithSecondFactor}
                initialValues={INITIAL_VALUES}
                requiredMark={false}
                layout='vertical'
            >
                {FirstFactorAuthenticationStep}
                {SecondFactorAuthenticationStep}
            </Form>

            {ProblemsModal}
        </>
    )
}
