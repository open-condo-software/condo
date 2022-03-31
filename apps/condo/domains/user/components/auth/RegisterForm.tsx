import { Col, Form, Input, Row, Typography } from 'antd'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import get from 'lodash/get'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import {
    EMAIL_ALREADY_REGISTERED_ERROR,
    MIN_PASSWORD_LENGTH_ERROR,
    CONFIRM_PHONE_ACTION_EXPIRED,
    PHONE_ALREADY_REGISTERED_ERROR,
} from '@condo/domains/user/constants/errors'
import { REGISTER_NEW_USER_MUTATION } from '@condo/domains/user/gql'
import { AuthLayoutContext } from '../containers/AuthLayoutContext'
import { useRegisterFormValidators } from './hooks'
import { RegisterContext } from './RegisterContextProvider'
import { colors } from '../../../common/constants/style'



interface IRegisterFormProps {
    onFinish: (userId: string) => void
}

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
    const PhoneIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsAlreadyRegistered' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const EmailIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsAlreadyRegistered' })
    const ConfirmActionExpiredError = intl.formatMessage({ id: 'pages.auth.register.ConfirmActionExpiredError' })
    const RegistrationTitle = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })

    const PASSWORD_MSG_LABEL = <label style={{ whiteSpace: 'break-spaces' }}>{PasswordMsg}</label>
    const CONFIRM_PASSWORD_MSG_LABEL = <label style={{ whiteSpace: 'break-spaces' }}>{ConfirmPasswordMsg}</label>

    const ROW_STYLES: React.CSSProperties = { justifyContent: 'center', textAlign: 'center' }
    const validators = useRegisterFormValidators()
    const ErrorToFormFieldMsgMapping = useMemo(() => {
        return {
            [CONFIRM_PHONE_ACTION_EXPIRED]: {
                name: 'phone',
                errors: [ConfirmActionExpiredError],
            },
            [PHONE_ALREADY_REGISTERED_ERROR]: {
                name: 'phone',
                errors: [PhoneIsAlreadyRegisteredMsg],
            },
            [EMAIL_ALREADY_REGISTERED_ERROR]: {
                name: 'email',
                errors: [EmailIsAlreadyRegisteredMsg],
            },
            [MIN_PASSWORD_LENGTH_ERROR]: {
                name: 'password',
                errors: [PasswordIsTooShortMsg],
            },
        }
    }, [intl])

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
            intl,
            form,
            ErrorToFormFieldMsgMapping,
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
            layout={'vertical'}
            validateTrigger={['onBlur', 'onSubmit']}
        >
            <Row gutter={[0, 30]} style={ROW_STYLES}>
                <Col flex={'0 0 80%'} span={24}>
                    <Row>
                        <Col span={24}>
                            <Typography.Title style={{ textAlign: 'start', fontWeight: 700 }}
                                level={2}>{RegistrationTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='phone'
                                label={PhoneMsg}
                                rules={validators.phone}
                            >
                                <PhoneInput disabled={true} placeholder={ExamplePhoneMsg} block/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='name'
                                label={NameMsg}
                                rules={validators.name}
                            >
                                <Input placeholder={ExampleNameMsg}/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='email'
                                label={EmailMsg}
                                rules={validators.email}
                            >
                                <Input autoComplete='chrome-off' placeholder={EmailPlaceholder}/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='password'
                                label={PASSWORD_MSG_LABEL}
                                rules={validators.password}
                            >
                                <Input.Password autoComplete='new-password'/>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='confirm'
                                label={CONFIRM_PASSWORD_MSG_LABEL}
                                dependencies={['password']}
                                rules={validators.confirm}
                            >
                                <Input.Password/>
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={20}>
                    <Form.Item>
                        <Button
                            key='submit'
                            type='sberDefaultGradient'
                            htmlType='submit'
                            loading={isLoading}
                            style={{ width: '100%' }}
                        >
                            {RegisterMsg}
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    )
}
