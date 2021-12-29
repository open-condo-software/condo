import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useMutation } from '@core/next/apollo'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useIntl } from '@core/next/intl'
import { CREATE_ONBOARDING_MUTATION } from '@condo/domains/onboarding/gql'
import {
    EMAIL_ALREADY_REGISTERED_ERROR,
    MIN_PASSWORD_LENGTH_ERROR,
    CONFIRM_PHONE_ACTION_EXPIRED,
    PHONE_ALREADY_REGISTERED_ERROR,
} from '@condo/domains/user/constants/errors'
import { useRegisterFormValidators } from '@condo/domains/user/components/auth/hooks'
import { AuthLayoutContext } from '@condo/domains/user/components/containers/AuthLayoutContext'
import { REGISTER_NEW_USER_MUTATION } from '@condo/domains/user/gql'
import { Form, Row, Col, Input } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { get } from 'lodash'
import PhoneInput from 'react-phone-input-2'
import { FORM_LAYOUT } from '@condo/domains/user/constants/layout'
import { RegisterPageStep } from './RegisterPageStep'
import { useConfirmIdentityContext } from '../ConfirmIdentityContext'


export function FillCredentialsView () {
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

    const { token, phone, tokenLoading, isConfirmed, setToken, setStep } = useConfirmIdentityContext()
    const router = useRouter()
    const [createOnBoarding] = useMutation(CREATE_ONBOARDING_MUTATION, {
        onCompleted: () => {
            router.push('/onboarding')
        },
    })

    const initOnBoarding = useCallback((userId: string) => {
        const onBoardingExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }

        const data = { ...onBoardingExtraData, type: 'ADMINISTRATOR', userId }

        runMutation({
            mutation: createOnBoarding,
            variables: { data },
            intl,
        })
    }, [createOnBoarding, intl])

    const onRegisterFinish = useCallback((userId: string) => {
        setToken(null)
        initOnBoarding(userId)
    }, [initOnBoarding, setToken])

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
                    onRegisterFinish(userId)
                })
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(() => {
            setIsLoading(false)
        })
    }, [form, token, registerMutation, intl, ErrorToFormFieldMsgMapping, signInByPhone, onRegisterFinish])

    const initialValues = { phone }

    useEffect(() => {
        console.log('fill credentials mounted')
    }, [])

    useEffect(() => {
        if (tokenLoading) return
        console.log(token, isConfirmed, phone)
        if (!token || !isConfirmed || !phone) {
            setStep(RegisterPageStep.EnterPhone)
        }
    }, [tokenLoading])


    return (
        <Form
            {...FORM_LAYOUT}
            form={form}
            name='register'
            onFinish={registerComplete}
            initialValues={initialValues}
            colon={false}
            requiredMark={true}
            labelAlign={'left'}
            validateTrigger={['onBlur', 'onSubmit']}
        >
            <Row gutter={[0, 60]}>
                <Col span={24}>
                    <Row gutter={[0, 40]}>
                        <Col span={24}>
                            <Row gutter={[0, 24]}>
                                <Col span={24}>
                                    <Form.Item
                                        name='phone'
                                        label={PhoneMsg}
                                        rules={validators.phone}
                                    >
                                        <PhoneInput disabled={true} placeholder={ExamplePhoneMsg} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        name='name'
                                        label={NameMsg}
                                        rules={validators.name}
                                    >
                                        <Input placeholder={ExampleNameMsg} disabled={tokenLoading} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        name='email'
                                        label={EmailMsg}
                                        rules={validators.email}
                                    >
                                        <Input autoComplete='chrome-off' placeholder={EmailPlaceholder} disabled={tokenLoading} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[0, 24]}>
                                <Col span={24}>
                                    <Form.Item
                                        name='password'
                                        label={PasswordMsg}
                                        rules={validators.password}
                                    >
                                        <Input.Password autoComplete='new-password' disabled={tokenLoading} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        name='confirm'
                                        label={ConfirmPasswordMsg}
                                        dependencies={['password']}
                                        rules={validators.confirm}
                                    >
                                        <Input.Password disabled={tokenLoading} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Form.Item>
                        <Button
                            key='submit'
                            type='sberPrimary'
                            htmlType='submit'
                            loading={isLoading}
                            disabled={tokenLoading}
                        >
                            {RegisterMsg}
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    )
}
