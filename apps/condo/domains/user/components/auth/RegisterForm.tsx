import { Col, Form, Row, RowProps } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useContext, useState } from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { colors } from '@condo/domains/common/constants/style'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { AuthLayoutContext } from '@condo/domains/user/components/containers/AuthLayoutContext'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { RequiredFlagWrapper } from '@condo/domains/user/components/containers/styles'
import { REGISTER_NEW_USER_MUTATION } from '@condo/domains/user/gql'

import { useRegisterFormValidators } from './hooks'
import { RegisterContext } from './RegisterContextProvider'


interface IRegisterFormProps {
    onFinish: (userId: string) => void
}

const ROW_STYLES: React.CSSProperties = {
    justifyContent: 'center',
}
const FORM_PHONE_STYLES: React.CSSProperties = {
    borderRadius: 8,
    borderColor: colors.inputBorderGrey,
}
const BUTTON_FORM_GUTTER: RowProps['gutter'] = [0, 40]

export const RegisterForm: React.FC<IRegisterFormProps> = ({ onFinish }) => {
    const intl = useIntl()
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const ExampleNameMsg = intl.formatMessage({ id: 'example.Name' })
    const EmailPlaceholder = intl.formatMessage({ id: 'example.Email' })
    const NameMsg = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.Password' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.ConfirmPassword' })
    const EmailMsg = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const RegistrationTitle = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })

    const validators = useRegisterFormValidators()

    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = useState(false)
    const { phone, token } = useContext(RegisterContext)
    const { signInByPhone } = useContext(AuthLayoutContext)
    const [registerMutation] = useMutation(REGISTER_NEW_USER_MUTATION)

    const registerComplete = useCallback(async () => {
        const registerExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        const { name, email: inputEmail, password } = form.getFieldsValue(['name', 'email', 'password'])

        const email = inputEmail ? inputEmail.toLowerCase().trim() : ''
        const data = { name, email, password, ...registerExtraData, confirmPhoneActionToken: token }
        setIsLoading(true)

        return runMutation({
            mutation: registerMutation,
            variables: { data },
            onCompleted: ({ data }) => {
                signInByPhone(form.getFieldsValue(['phone', 'password']), () => {
                    const userId = get(data, ['user', 'id'])

                    onFinish(userId)
                })
            },
            // Skip notification
            OnCompletedMsg: null,
            intl,
            form,
        }).catch(() => {
            setIsLoading(false)
        })
    }, [intl, form, signInByPhone, token])

    const initialValues = { phone }

    return (
        <Form
            form={form}
            name='register'
            onFinish={registerComplete}
            initialValues={initialValues}
            colon={false}
            requiredMark={true}
            layout='vertical'
            validateTrigger={['onBlur', 'onSubmit']}
        >
            <Row gutter={BUTTON_FORM_GUTTER} style={ROW_STYLES}>
                <ResponsiveCol span={24}>
                    <Row>
                        <Col span={24}>
                            <Typography.Title level={2}>{RegistrationTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <RequiredFlagWrapper>
                                <Form.Item
                                    name='phone'
                                    label={PhoneMsg}
                                    rules={validators.phone}
                                    validateFirst
                                >
                                    <PhoneInput style={FORM_PHONE_STYLES} disabled={true} placeholder={ExamplePhoneMsg} block/>
                                </Form.Item>
                            </RequiredFlagWrapper>
                        </Col>
                        <Col span={24}>
                            <RequiredFlagWrapper>
                                <Form.Item
                                    name='name'
                                    label={NameMsg}
                                    rules={validators.name}
                                    data-cy='register-name-item'
                                    validateFirst
                                >
                                    <RequiredFlagWrapper><Input placeholder={ExampleNameMsg}/></RequiredFlagWrapper>
                                </Form.Item>
                            </RequiredFlagWrapper>
                        </Col>
                        <Col span={24}>
                            <RequiredFlagWrapper>
                                <Form.Item
                                    name='email'
                                    label={EmailMsg}
                                    rules={validators.email}
                                    data-cy='register-email-item'
                                    validateFirst
                                >
                                    <Input autoComplete='chrome-off' placeholder={EmailPlaceholder}/>
                                </Form.Item>
                            </RequiredFlagWrapper>
                        </Col>
                        <Col span={24}>
                            <RequiredFlagWrapper>
                                <Form.Item
                                    name='password'
                                    label={PasswordMsg}
                                    rules={validators.password}
                                    data-cy='register-password-item'
                                    validateFirst
                                >
                                    <Input.Password autoComplete='new-password'/>
                                </Form.Item>
                            </RequiredFlagWrapper>
                        </Col>
                        <Col span={24}>
                            <RequiredFlagWrapper>
                                <Form.Item
                                    name='confirm'
                                    label={ConfirmPasswordMsg}
                                    dependencies={['password']}
                                    rules={validators.confirm}
                                    data-cy='register-confirmpassword-item'
                                    validateFirst
                                >
                                    <Input.Password/>
                                </Form.Item>
                            </RequiredFlagWrapper>
                        </Col>
                    </Row>
                </ResponsiveCol>
                <ResponsiveCol span={24}>
                    <Form.Item>
                        <Button
                            key='submit'
                            type='primary'
                            htmlType='submit'
                            loading={isLoading}
                            block
                            data-cy='registercomplete-button'
                        >
                            {RegisterMsg}
                        </Button>
                    </Form.Item>
                </ResponsiveCol>
            </Row>
        </Form>
    )
}
