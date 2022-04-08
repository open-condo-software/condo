import { Col, Form, Input, Row, Typography } from 'antd'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { WRONG_PASSWORD_ERROR, WRONG_PHONE_ERROR } from '@condo/domains/user/constants/errors'
import { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } from '@condo/domains/user/gql'
import { useMutation } from '@core/next/apollo'
import { useAuth } from '@core/next/auth'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { JAVASCRIPT_URL_XSS } from '@condo/domains/common/constants/regexps'

const FORM_LAYOUT = {
    labelCol: { span: 10 },
    wrapperCol: { span: 14 },
}

export const SignInForm = (): React.ReactElement => {
    const intl = useIntl()
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ResetMsg = intl.formatMessage({ id: 'pages.auth.signin.ResetPasswordLinkTitle' })
    const PasswordOrPhoneMismatch = intl.formatMessage({ id: 'pages.auth.WrongPhoneOrPassword' })


    const { isSmall } = useLayoutContext()
    const [form] = Form.useForm()
    const router = useRouter()
    const { query: { next }  } = router
    const redirectUrl = (next && !Array.isArray(next) && !next.match(JAVASCRIPT_URL_XSS)) ? next : '/'
    const { refetch } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [signinByPhoneAndPassword] = useMutation(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION)
    const ErrorToFormFieldMsgMapping = useMemo(() => {
        return {
            [WRONG_PHONE_ERROR]: {
                name: 'signinError',
                errors: [PasswordOrPhoneMismatch],
            },
            [WRONG_PASSWORD_ERROR]: {
                name: 'signinError',
                errors: [PasswordOrPhoneMismatch],
            },
        }
    }, [intl])

    const onFormSubmit = useCallback((values) => {
        setIsLoading(true)

        return runMutation({
            mutation: signinByPhoneAndPassword,
            variables: values,
            onCompleted: () => {
                refetch().then(() => {
                    return router.push(redirectUrl)
                })
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(() => {
            setIsLoading(false)
        })
    }, [intl, form])

    const initialValues = { password: '', phone: '' }

    return (
        <Form
            {...FORM_LAYOUT}
            form={form}
            name='signin'
            labelAlign='left'
            onFinish={onFormSubmit}
            initialValues={initialValues}
            colon={false}
            requiredMark={false}
        >
            <Row gutter={[0, 40]}>
                <Col span={24} >
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Form.Item
                                name='phone'
                                label={PhoneMsg}
                                rules={[{ required: true, message: FieldIsRequiredMsg }]}
                                data-cy={'signin-phone-item'}
                            >
                                <PhoneInput placeholder={ExamplePhoneMsg} tabIndex={1} block/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='password'
                                label={PasswordMsg}
                                labelAlign='left'
                                rules={[{ required: true, message: FieldIsRequiredMsg }]}
                                data-cy={'signin-password-item'}
                            >
                                <Input.Password tabIndex={2} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Row justify={'start'} align={'middle'} gutter={[0, 40]}>
                        <Col xs={24}>
                            <Row justify={'space-between'} gutter={[0, 12]}>
                                <Col xs={24} lg={7}>
                                    <Button
                                        key='submit'
                                        type='sberPrimary'
                                        htmlType='submit'
                                        loading={isLoading}
                                        data-cy={'signin-button'}
                                        block
                                    >
                                        {SignInMsg}
                                    </Button>
                                </Col >
                                <Col xs={24} lg={14} offset={isSmall ? 0 : 3} style={{ textAlign: 'right' }}>
                                    <Typography.Paragraph type='secondary' style={{ marginTop: '10px' }}>
                                        <FormattedMessage
                                            id='pages.auth.signin.ResetPasswordLink'
                                            values={{
                                                link: (
                                                    <Button type={'inlineLink'} size={'small'} onClick={() => Router.push('/auth/forgot')}>
                                                        {ResetMsg}
                                                    </Button>
                                                ),
                                            }}
                                        />
                                    </Typography.Paragraph>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
            </Row>

        </Form>
    )
}
