import Router from 'next/router'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import React, { useState, useEffect, useContext } from 'react'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useLazyQuery, useMutation } from '@core/next/apollo'
import { CHANGE_PASSWORD_WITH_TOKEN_MUTATION, GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY } from '@condo/domains/user/gql'
import { PASSWORD_IS_TOO_SHORT } from '@condo/domains/user/constants/errors'
import { useAuth } from '@core/next/auth'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { ButtonHeaderActions } from '@condo/domains/common/components/HeaderActions'
import { Loader } from '@condo/domains/common/components/Loader'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { AuthLayoutContext } from '@condo/domains/user/components/containers/AuthLayoutContext'
import { fontSizes } from '@condo/domains/common/constants/style'

const FORM_LAYOUT = {
    labelCol: { span: 10 },
    wrapperCol: { span: 24 },
}

const ROW_STYLES: React.CSSProperties = { justifyContent: 'center', textAlign: 'center' }

const ChangePasswordPage: AuthPage = () => {
    const [form] = Form.useForm()
    const { token } = getQueryParams()
    const initialValues = { token, password: '', confirm: '' }
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [changePassword] = useMutation(CHANGE_PASSWORD_WITH_TOKEN_MUTATION)
    const auth = useAuth()
    const { executeRecaptcha } = useGoogleReCaptcha()

    const intl = useIntl()
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
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

    // New format of errors mapping, assuming, that errors are received from server with localized messages for user
    // Here we just need to map an error type to form field
    const ErrorToFormFieldMsgMapping = {
        [PASSWORD_IS_TOO_SHORT]: {
            name: 'password',
        },
    }

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
        return runMutation({
            mutation: changePassword,
            variables: { data: { token, password } },
            onCompleted: async ({ data: { result } }) => {
                await signInByPhone({
                    phone: result.phone,
                    password: form.getFieldValue('password'),
                }, () => {
                    auth.refetch().then(() => {
                        setIsSaving(false)
                        Router.push( '/')
                    })
                })
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(() => {
            setIsSaving(false)
        })
    }

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
        if (!executeRecaptcha || !token) return

        executeRecaptcha('get_confirm_phone_token_info')
            .then(captcha => checkConfirmPhoneActionToken({ variables: { data: { token, captcha } } }))
    }, [executeRecaptcha, token])

    if (isLoading){
        return <Loader size="large" delay={0} fill />
    }

    if (recoveryTokenError) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>{ChangePasswordTokenErrorLabel}</Typography.Title>
                <Typography.Text style={{ fontSize: fontSizes.content }}>{ChangePasswordTokenErrorMessage}</Typography.Text>
                <Button
                    type='sberPrimary'
                    style={{ marginTop: '16px' }}
                    onClick={() => Router.push('/auth/forgot')}
                >{ChangePasswordTokenErrorConfirmLabel}</Button>
            </BasicEmptyListView>
        )
    }

    return (
        <Form
            {...FORM_LAYOUT}
            form={form}
            name="change-password"
            onFinish={onFinish}
            initialValues={initialValues}
            colon={false}
            labelAlign='left'
            requiredMark={false}
            layout={'vertical'}
        >
            <Row gutter={[0, 40]} style={ROW_STYLES}>
                <Col span={24} flex={'0 0 80%'}>
                    <Typography.Title level={2} style={{ textAlign:'start', fontWeight: 700, fontSize: 20 }}>{ResetTitle}</Typography.Title>
                </Col>
                <Form.Item name="token" style={{ display: 'none' }}>
                    <Input type="hidden" />
                </Form.Item>
                <Col span={24} flex={'0 0 80%'}>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Form.Item
                                name="password"
                                label={CreateNewPasswordMsg}
                                rules={validations.password}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="confirm"
                                label={ConfirmPasswordMsg}
                                dependencies={['password']}
                                rules={validations.confirmPassword}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={24} flex={'0 0 80%'}>
                    <Form.Item wrapperCol={{ span: 24 }}>
                        <Button
                            key='submit'
                            type='sberDefaultGradient'
                            loading={isSaving}
                            htmlType="submit"
                            style={{ width: '100%' }}
                        >
                            {SaveMsg} {AndSignInMsg}
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    )
}


ChangePasswordPage.container = AuthLayout

export default ChangePasswordPage
