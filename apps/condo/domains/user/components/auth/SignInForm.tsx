import React, { useCallback, useMemo, useState } from 'react'
import { Col, Form, Row, RowProps, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import Router, { useRouter } from 'next/router'
import { FormattedMessage } from 'react-intl'
import { useIntl } from '@condo/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { WRONG_PASSWORD_ERROR, WRONG_PHONE_ERROR } from '@condo/domains/user/constants/errors'
import { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } from '@condo/domains/user/gql'
import { useMutation } from '@condo/next/apollo'
import { useAuth } from '@condo/next/auth'
import { SberIconWithoutLabel } from '@condo/domains/common/components/icons/SberIcon'
import { JAVASCRIPT_URL_XSS } from '@condo/domains/common/constants/regexps'
import { colors } from '@condo/domains/common/constants/style'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'

const ROW_STYLES: React.CSSProperties = {
    justifyContent: 'center',
}
const FORM_TYPOGRAPHY_STYLES: React.CSSProperties = {
    textAlign:'center',
}
const FORM_PARAGRAPH_STYLES: React.CSSProperties = {
    margin: '24px 0 40px',
}
const FORM_PHONE_STYLES: React.CSSProperties = { borderRadius: 8, borderColor: colors.inputBorderGrey }
const FORM_BUTTONS_GUTTER: RowProps['gutter'] = [0, 20]

export const SignInForm = (): React.ReactElement => {
    const intl = useIntl()
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ResetMsg = intl.formatMessage({ id: 'pages.auth.signin.ResetPasswordLinkTitle' })
    const PasswordOrPhoneMismatch = intl.formatMessage({ id: 'pages.auth.WrongPhoneOrPassword' })
    const LoginBySBBOLMsg = intl.formatMessage({ id: 'LoginBySBBOL' })

    const LOGIN_PHONE_LABEL = <label style={{ alignSelf: 'flex-end' }}>{PhoneMsg}</label>
    const PASSWORD_LABEL = <label style={{ alignSelf: 'flex-end' }}>{PasswordMsg}</label>

    const [form] = Form.useForm()
    const router = useRouter()
    const { query: { next }  } = router
    const redirectUrl = (next && !Array.isArray(next) && !next.match(JAVASCRIPT_URL_XSS)) ? next : '/'
    const { refetch } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [signinByPhoneAndPassword] = useMutation(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION)
    // TODO(DOMA-3293): remove this legacy error style and Useless error messages
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
            form={form}
            name='signin'
            onFinish={onFormSubmit}
            initialValues={initialValues}
            requiredMark={false}
            layout={'vertical'}
        >
            <Row style={ROW_STYLES}>
                <ResponsiveCol span={24}>
                    <Row>
                        <Col span={24}>
                            <Form.Item
                                name='phone'
                                label={LOGIN_PHONE_LABEL}
                                rules={[{ required: true, message: FieldIsRequiredMsg }]}
                                data-cy={'signin-phone-item'}
                            >
                                <PhoneInput
                                    style={FORM_PHONE_STYLES}
                                    placeholder={ExamplePhoneMsg}
                                    tabIndex={1}
                                    block
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='password'
                                label={PASSWORD_LABEL}
                                rules={[{ required: true, message: FieldIsRequiredMsg }]}
                                data-cy={'signin-password-item'}
                            >
                                <Input.Password tabIndex={2}/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Typography.Paragraph type='secondary' style={FORM_PARAGRAPH_STYLES}>
                                <FormattedMessage
                                    id='pages.auth.signin.ResetPasswordLink'
                                    values={{
                                        link: (
                                            <Typography.Link
                                                style={{ color: colors.black }}
                                                onClick={() => Router.push('/auth/forgot')}>
                                                {ResetMsg}
                                            </Typography.Link>
                                        ),
                                    }}
                                />
                            </Typography.Paragraph>
                        </Col>
                    </Row>
                    <Row gutter={FORM_BUTTONS_GUTTER}>
                        <Col span={24}>
                            <Form.Item>
                                <Button
                                    key='submit'
                                    type='sberDefaultGradient'
                                    htmlType='submit'
                                    loading={isLoading}
                                    block
                                    data-cy={'signin-button'}
                                >
                                    {SignInMsg}
                                </Button>
                            </Form.Item>
                        </Col>
                        <Col span={24} style={FORM_TYPOGRAPHY_STYLES}>
                            <FormattedMessage id='Or'/>
                        </Col>
                        <Col span={24}>
                            <Form.Item>
                                <Button
                                    key='submit'
                                    type={'sberAction'}
                                    secondary
                                    icon={<SberIconWithoutLabel/>}
                                    href={'/api/sbbol/auth'}
                                    block
                                >
                                    {LoginBySBBOLMsg}
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </ResponsiveCol>
            </Row>
        </Form>
    )
}
