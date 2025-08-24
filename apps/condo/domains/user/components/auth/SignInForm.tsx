import {
    useAuthenticateUserWithPhoneAndPasswordMutation,
    useAuthenticateUserWithEmailAndPasswordMutation,
} from '@app/condo/gql'
import { UserTypeType as UserType } from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Input } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { WRONG_CREDENTIALS } from '@condo/domains/user/constants/errors'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'
import { normalizeUserIdentifier } from '@condo/domains/user/utils/helpers'

import { AgreementText } from './AgreementText'

import type { FetchResult } from '@apollo/client/link/core'
import type { AuthenticateUserWithPhoneAndPasswordMutation, AuthenticateUserWithEmailAndPasswordMutation } from '@app/condo/gql'


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

    const router = useRouter()

    const { authMethods } = useAuthMethods()

    const { refetch } = useAuth()
    const { executeCaptcha } = useHCaptcha()

    const [form] = Form.useForm()

    const [isLoading, setIsLoading] = useState(false)

    const { query: { next }  } = router

    const redirectUrl = (next && !Array.isArray(next) && isSafeUrl(next)) ? next : '/'

    const onError = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [WRONG_CREDENTIALS]: 'identifier',
        },
    })
    const [authenticateUserWithPhoneAndPassword] = useAuthenticateUserWithPhoneAndPasswordMutation({
        onError,
    })
    const [authenticateUserWithEmailAndPassword] = useAuthenticateUserWithEmailAndPasswordMutation({
        onError,
    })

    const onFormSubmit = useCallback(async (values: { identifier: string, password: string }): Promise<void> => {
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

            const identifierType = normalizeUserIdentifier(values.identifier).type

            let res: FetchResult<AuthenticateUserWithEmailAndPasswordMutation> | FetchResult<AuthenticateUserWithPhoneAndPasswordMutation>
            if (identifierType === 'email') {
                res = await authenticateUserWithEmailAndPassword({
                    variables: {
                        data: {
                            ...commonPayload,
                            email: values.identifier,
                            password: values.password,
                            userType: UserType.Staff,
                        },
                    },
                })
            } else {
                res = await authenticateUserWithPhoneAndPassword({
                    variables: {
                        data: {
                            ...commonPayload,
                            phone: values.identifier,
                            password: values.password,
                            userType: UserType.Staff,
                        },
                    },
                })
            }

            if (!res.errors && res.data?.result?.item?.id) {
                await refetch()
                await router.push(redirectUrl)
                return
            }
        } catch (error) {
            console.error('Authorization failed')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, executeCaptcha, authenticateUserWithEmailAndPassword, authenticateUserWithPhoneAndPassword, refetch, router, redirectUrl])

    return (
        <Form
            form={form}
            name='signin'
            onFinish={onFormSubmit}
            initialValues={INITIAL_VALUES}
            requiredMark={false}
            layout='vertical'
        >
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
                                                    <Link href={`/auth/forgot?next=${encodeURIComponent(redirectUrl)}`}>
                                                        <Typography.Link href={`/auth/forgot?next=${encodeURIComponent(redirectUrl)}`} tabIndex={3}>
                                                            {ResetPasswordMessage}
                                                        </Typography.Link>
                                                    </Link>
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
        </Form>
    )
}
