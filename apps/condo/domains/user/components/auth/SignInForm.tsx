import { useAuthenticateUserWithPhoneAndPasswordMutation } from '@app/condo/gql'
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

import { AgreementText } from './AgreementText'


const { publicRuntimeConfig: { hasSbbolAuth, defaultLocale } } = getConfig()

const INITIAL_VALUES = { password: '', phone: '' }
const PHONE_INPUT_PROPS = { tabIndex: 1, autoFocus: true }
const TAB_INDEXES = { termsOfUse: 7, consentLink: 9, privacyPolicyLink: 8 }

export const SignInForm = (): React.ReactElement => {
    const intl = useIntl()
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const PhoneMessage = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
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
            [WRONG_CREDENTIALS]: 'phone',
        },
    })
    const [authenticateUserWithPhoneAndPassword] = useAuthenticateUserWithPhoneAndPasswordMutation({
        onError,
    })

    const onFormSubmit = useCallback(async (values: { phone: string, password: string }): Promise<void> => {
        if (isLoading) return

        setIsLoading(true)

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const res = await authenticateUserWithPhoneAndPassword({
                variables: {
                    data: {
                        captcha: captcha,
                        phone: values.phone,
                        password: values.password,
                        userType: UserType.Staff,
                        sender,
                        dv: 1,
                    },
                },
            })

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
    }, [isLoading, executeCaptcha, authenticateUserWithPhoneAndPassword, refetch, router, redirectUrl])

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
                            authMethods.phonePassword && (
                                <Col span={24}>
                                    <Row gutter={[0, 24]}>
                                        <Col span={24}>
                                            <FormItem
                                                name='phone'
                                                label={PhoneMessage}
                                                rules={[{ required: true, message: FieldIsRequiredMessage }]}
                                                data-cy='signin-phone-item'
                                            >
                                                <Input.Phone country={defaultLocale} placeholder={ExamplePhoneMessage} inputProps={PHONE_INPUT_PROPS} />
                                            </FormItem>
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
                                    authMethods.phonePassword && (
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
