import { useAuthenticateUserWithPhoneAndPasswordMutation, useChangePasswordWithTokenMutation } from '@app/condo/gql'
import { UserTypeType as UserType } from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

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
    const { queryParams } = useAuthMethods()

    const { executeCaptcha } = useHCaptcha()
    const { token, tokenError } = useRegisterContext()
    const { refetch } = useAuth()

    const [form] = Form.useForm()

    const [isLoading, setIsLoading] = useState<boolean>(false)

    const changePasswordErrorHandler = useMutationErrorHandler({
        form,
    })
    const [changePasswordWithTokenMutation] = useChangePasswordWithTokenMutation({
        onError: changePasswordErrorHandler,
    })

    const authenticateUserErrorHandler = useMutationErrorHandler()
    const [authenticateUserWithPhoneAndPasswordMutation] = useAuthenticateUserWithPhoneAndPasswordMutation({
        onError: authenticateUserErrorHandler,
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

    const authWithPhoneAndPassword = useCallback(async (phone: string, password: string): Promise<void> => {
        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const res = await authenticateUserWithPhoneAndPasswordMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        password,
                        phone,
                        userType: UserType.Staff,
                    },
                },
            })

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
    }, [authenticateUserWithPhoneAndPasswordMutation, executeCaptcha])

    const onSubmit = useCallback(async (values: typeof INITIAL_VALUES) => {
        if (isLoading) return

        setIsLoading(true)

        try {
            const { password } = values
            const sender = getClientSideSenderInfo()
            // const captcha = await executeCaptcha()

            const res = await changePasswordWithTokenMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        password,
                        token,
                        // captcha,
                    },
                },
            })

            const status = res?.data?.result?.status
            const phone = res?.data?.result?.phone
            if (!res.errors && status === 'ok' && phone) {
                await authWithPhoneAndPassword(phone, password)
                await refetch()
                await Router.push(redirectUrl)
            }
        } catch (error) {
            console.error('Change password failed')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [authWithPhoneAndPassword, changePasswordWithTokenMutation, isLoading, refetch, token])

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
