import styled from '@emotion/styled'
import { Col, Form, Row, RowProps } from 'antd'
import Router, { useRouter } from 'next/router'
import React, { useState, useEffect, useContext, useCallback } from 'react'

import { useLazyQuery, useMutation } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'
import { Typography } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { Loader } from '@condo/domains/common/components/Loader'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { AuthLayoutContext } from '@condo/domains/user/components/containers/AuthLayoutContext'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'
import { CHANGE_PASSWORD_WITH_TOKEN_MUTATION, GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY } from '@condo/domains/user/gql'


const ROW_STYLES: React.CSSProperties = {
    justifyContent: 'center',
}
const BUTTON_GUTTER: RowProps['gutter'] = [0, 40]
const TYPOGRAPHY_GUTTER: RowProps['gutter'] = [0, 20]
const FORM_GUTTER: RowProps['gutter'] = [0, 24]
const FOOTER_GUTTER: RowProps['gutter'] = [0, 20]

const FormItemOnlyError = styled(Form.Item)`
  .ant-form-item-control-input {
    display: none;
  }
`

const ChangePasswordPage: AuthPage = () => {
    const router = useRouter()
    const [form] = Form.useForm()
    const { token } = router.query
    const initialValues = { token, password: '', confirm: '' }
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [changePassword] = useMutation(CHANGE_PASSWORD_WITH_TOKEN_MUTATION)
    const auth = useAuth()
    // const { executeRecaptcha } = useGoogleReCaptcha()
    const { executeCaptcha } = useHCaptcha()

    const intl = useIntl()
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const CreateNewPasswordMsg = intl.formatMessage({ id: 'pages.auth.reset.CreateNewPasswordMsg' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.ConfirmPassword' })
    const AndSignInMsg = intl.formatMessage({ id: 'pages.auth.reset.AndSignInMsg' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const ChangePasswordTokenErrorLabel = intl.formatMessage({ id: 'pages.auth.ChangePasswordTokenErrorLabel' })
    const ChangePasswordTokenErrorMessage = intl.formatMessage({ id: 'pages.auth.ChangePasswordTokenErrorMessage' })
    const ChangePasswordTokenErrorConfirmLabel = intl.formatMessage({ id: 'pages.auth.ChangePasswordTokenErrorConfirmLabel' })

    const CREATE_NEW_PASSWORD_SPAN = <span style={{ alignSelf: 'flex-end' }}>{CreateNewPasswordMsg}</span>
    const CONFIRM_NEW_PASSWORD_SPAN = <span style={{ alignSelf: 'flex-end' }}>{ConfirmPasswordMsg}</span>

    const { requiredValidator, changeMessage, minLengthValidator } = useValidations()
    const minPasswordLengthValidator = changeMessage(minLengthValidator(MIN_PASSWORD_LENGTH), PasswordIsTooShortMsg)
    const validations = {
        password: [changeMessage(requiredValidator, PleaseInputYourPasswordMsg), minPasswordLengthValidator],
        confirmPassword: [
            changeMessage(requiredValidator, PleaseConfirmYourPasswordMsg),
            ({ getFieldValue }) => ({
                validator (_, value) {
                    if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                    }
                    return Promise.reject(TwoPasswordDontMatchMsg)
                },
            }),
        ],
    }
    const { signInByPhone } = useContext(AuthLayoutContext)

    const onFinish = (values: typeof initialValues) => {
        setIsSaving(true)
        const { token, password } = values
        const sender = getClientSideSenderInfo()
        return runMutation({
            mutation: changePassword,
            variables: { data: { token, password, dv: 1, sender } },
            onCompleted: async ({ data: { result } }) => {
                await signInByPhone({
                    phone: result.phone,
                    password: form.getFieldValue('password'),
                }, () => {
                    auth.refetch().then(() => {
                        setIsSaving(false)
                        Router.push('/')
                    })
                })
            },
            intl,
            form,
        }).catch(() => {
            setIsSaving(false)
        })
    }

    const onResetPasswordClick = useCallback(() => Router.push('/auth/forgot'), [])

    const [checkConfirmPhoneActionToken] = useLazyQuery(GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY, {
        onError: error => {
            setRecoveryTokenError(error)
            setIsLoading(false)
        },
        onCompleted: () => {
            setRecoveryTokenError(null)
            setIsLoading(false)
        },
    })

    const [recoveryTokenError, setRecoveryTokenError] = useState<Error | null>(null)

    useEffect(() => {
        if (!executeCaptcha || !token) return

        executeCaptcha()
            .then(captcha => checkConfirmPhoneActionToken({ variables: { data: { token, captcha } } }))
    }, [executeCaptcha, token])

    if (isLoading) {
        return <Loader size='large' delay={0} fill/>
    }

    if (recoveryTokenError) {
        return (
            <Row>
                <ResponsiveCol>
                    <Row style={ROW_STYLES} gutter={BUTTON_GUTTER}>
                        <Col span={24}>
                            <Row gutter={TYPOGRAPHY_GUTTER}>
                                <Col span={24}>
                                    <Typography.Title level={2}>
                                        {ChangePasswordTokenErrorLabel}
                                    </Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Typography.Text>
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
            onFinish={onFinish}
            initialValues={initialValues}
            requiredMark={false}
            layout='vertical'
        >
            <Row>
                <ResponsiveCol>
                    <Row style={ROW_STYLES} gutter={FORM_GUTTER}>
                        <Col span={24}>
                            <Row>
                                <Form.Item>
                                    <Typography.Title level={2}>
                                        {ResetTitle}
                                    </Typography.Title>
                                </Form.Item>
                                <Form.Item name='token' className='error-only'>
                                    <Input type='hidden'/>
                                </Form.Item>
                                <Col span={24}>
                                    <Form.Item
                                        name='password'
                                        label={CREATE_NEW_PASSWORD_SPAN}
                                        rules={validations.password}
                                    >
                                        <Input.Password/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        name='confirm'
                                        label={CONFIRM_NEW_PASSWORD_SPAN}
                                        dependencies={['password']}
                                        rules={validations.confirmPassword}
                                    >
                                        <Input.Password/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={FOOTER_GUTTER}>
                                <Col span={24}>
                                    <FormItemOnlyError name='phone' />
                                </Col>
                                <Col span={24}>
                                    <Form.Item>
                                        <Button
                                            key='submit'
                                            type='primary'
                                            loading={isSaving}
                                            htmlType='submit'
                                            children={`${SaveMsg} ${AndSignInMsg}`}
                                            block
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </ResponsiveCol>
            </Row>
        </Form>
    )
}

ChangePasswordPage.headerAction = <></>
ChangePasswordPage.container = AuthLayout

export default ChangePasswordPage
