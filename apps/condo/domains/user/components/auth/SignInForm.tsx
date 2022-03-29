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
import { colors } from '../../../common/constants/style'

const FORM_LAYOUT = {
    labelCol: { span: 10 },
    wrapperCol: { span: 24 },
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
    const SberIdRegisterMsg = intl.formatMessage({ id: 'SberIdRegister' })


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
    const LOGIN_PHONE_LABEL = <label style={ { alignSelf:'end' } }>{PhoneMsg}</label>
    const PASSWORD_LABEL = <label style={ { alignSelf:'end' } }>{PasswordMsg}</label>
    return (
        <Form
            {...FORM_LAYOUT}
            form={form}
            name='signin'
            onFinish={onFormSubmit}
            initialValues={initialValues}
            requiredMark={false}
            layout={'vertical'}
            style={ { textAlign:'center', fontSize: 12, color:colors.textSecondary, lineHeight:'20px' } }
        >
            <Row justify={'center'}>
                <Col flex={'0 0 50%'} span={24} >
                    <Row gutter={[0, 20]}>
                        <Col span={24}>
                            <Form.Item
                                name='phone'
                                label={LOGIN_PHONE_LABEL}
                                rules={[{ required: true, message: FieldIsRequiredMsg }]}
                            >
                                <PhoneInput style={{ borderRadius: 8, borderColor: colors.inputBorderGrey }} placeholder={ExamplePhoneMsg} tabIndex={1} block/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='password'
                                label={PASSWORD_LABEL}
                                rules={[{ required: true, message: FieldIsRequiredMsg }]}
                            >
                                <Input.Password tabIndex={2} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Typography.Paragraph type='secondary' style={{ marginTop: '10px', textAlign: 'left' }}>
                                <FormattedMessage
                                    id='pages.auth.signin.ResetPasswordLink'
                                    values={{
                                        link: (
                                            <Typography.Link style={ { color:colors.black } } onClick={() => Router.push('/auth/forgot')}>
                                                {ResetMsg}
                                            </Typography.Link>
                                        ),
                                    }}
                                />
                            </Typography.Paragraph>
                        </Col >
                        <Col span={24}>
                            <Form.Item>
                                <Button
                                    key='submit'
                                    type='sberDefaultGradient'
                                    htmlType='submit'
                                    loading={isLoading}
                                    block
                                    style={ { width: '100%' } }
                                >
                                    {SignInMsg}
                                </Button>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <FormattedMessage id='Or'/>
                        </Col>
                        <Col span={24}>
                            <Form.Item>
                                <Button
                                    key='submit'
                                    type='sberAction'
                                    icon={<SberIconWithoutLabel/>}
                                    href={'/api/sbbol/auth'}
                                    block={isSmall}
                                    disabled={false}
                                    style={ { width: '100%' } }
                                >
                                    {SberIdRegisterMsg}
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Form>
    )
}
