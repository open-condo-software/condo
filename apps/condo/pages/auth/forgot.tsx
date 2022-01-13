import { Form, Typography, Row, Col } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'

import  { useRouter } from 'next/router'
import React, { useContext, useState } from 'react'
import { colors } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { START_CONFIRM_PHONE_MUTATION } from '@condo/domains/user/gql'
import { WRONG_PHONE_ERROR } from '@condo/domains/user/constants/errors'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { LOCK_TIMEOUT } from '@condo/domains/user/constants/common'
import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { ButtonHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { RegisterContext, RegisterContextProvider } from '@condo/domains/user/components/auth/RegisterContextProvider'
import { Loader } from '@condo/domains/common/components/Loader'

const LINK_STYLE = { color: colors.sberPrimary[7] }

const FORM_LAYOUT = {
    labelCol: { span: 10 },
    wrapperCol: { span: 14 },
}

function ResetPageView () {
    const intl = useIntl()
    const router = useRouter()
    const RestorePasswordMsg = intl.formatMessage({ id: 'pages.auth.reset.RestorePasswordTitle' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const InstructionsMsg = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp' })
    const PhoneIsNotRegisteredMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsNotRegistered' })
    const CheckPhoneMsg = intl.formatMessage({ id: 'pages.auth.reset.CheckPhone' })
    const ReturnToLoginPage = intl.formatMessage({ id: 'pages.auth.reset.ReturnToLoginPage' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })

    const [form] = Form.useForm()
    const { executeRecaptcha } = useGoogleReCaptcha()
    const { token, setToken, setPhone } = useContext(RegisterContext)

    type StepType = 'inputPhone' | 'validatePhone'
    const [step, setStep] = useState<StepType>('inputPhone')
    const [isLoading, setIsLoading] = useState(false)
    const [startConfirmPhone] = useMutation(START_CONFIRM_PHONE_MUTATION)

    const initialValues = { email: '' }
    const ErrorToFormFieldMsgMapping = {
        [WRONG_PHONE_ERROR]: {
            name: 'phone',
            errors: [PhoneIsNotRegisteredMsg],
        },
    }

    const { requiredValidator, phoneValidator } = useValidations()
    const validations = {
        phone: [requiredValidator, phoneValidator],
    }

    if (step === 'validatePhone') {
        return (
            <ValidatePhoneForm
                onFinish={() => router.push('/auth/change-password?token=' + token)}
                onReset={() => setStep('inputPhone')}
            />
        )
    }

    const startConfirmPhoneAction = async () => {
        setIsLoading(true)
        if (!executeRecaptcha) {
            return
        }
        const captcha = await executeRecaptcha('start_confirm_phone')
        if (!captcha) {
            return 
        }
        
        const sender = getClientSideSenderInfo()
        const dv = 1
        let { phone } = form.getFieldsValue(['phone'])
        phone = normalizePhone(phone)
        const values = { phone, dv, sender, captcha }

        return runMutation({
            mutation: startConfirmPhone,
            variables: { data: values },
            onCompleted: ({ data: { result: { token } } }) => {
                setPhone(phone)
                setToken(token)
                setIsLoading(false)
                setStep('validatePhone')
            },
            finally: () => setIsLoading(false),
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(err => {
            console.error(err)
            setIsLoading(false)
        })
    }
    const Content = () => {
        if (isLoading) {
            return <Loader size="large" />
        }
        return (
            <>
                <Col span={24}>
                    <Typography.Title style={{ textAlign: 'left' }}>{ResetTitle}</Typography.Title>
                </Col>
                <Col span={24}>
                    <Typography.Paragraph style={{ textAlign: 'left' }}>{InstructionsMsg}</Typography.Paragraph>
                </Col>
                <Col span={24}> 
                    <Form
                        {...FORM_LAYOUT}
                        form={form}
                        name='forgot-password'
                        validateTrigger={['onBlur', 'onSubmit']}
                        initialValues={initialValues}
                        colon={false}
                        labelAlign='left'
                        requiredMark={false}
                    >
                        <Row gutter={[0, 60]}>
                            <Col span={24}>
                                <Form.Item
                                    name='phone'
                                    label={PhoneMsg}
                                    rules={validations.phone}
                                >
                                    <PhoneInput placeholder={ExamplePhoneMsg} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item>
                                    <CountDownTimer action={startConfirmPhoneAction} id={'FORGOT_ACTION'} timeout={LOCK_TIMEOUT}>
                                        {({ countdown, runAction }) => {
                                            const isCountDownActive = countdown > 0
                                            return (
                                                <Button
                                                    onClick={() => {
                                                        form.validateFields().then(() => {
                                                            runAction()
                                                        }).catch(_ => {
                                                        // validation check failed - don't invoke runAction
                                                        })
                                                    }}
                                                    type={isCountDownActive ? 'sberGrey' : 'sberPrimary'}
                                                    disabled={isCountDownActive}
                                                    loading={isLoading}
                                                    htmlType='submit'
                                                >
                                                    {isCountDownActive ? `${RestorePasswordMsg} ${countdown}` : RestorePasswordMsg}
                                                </Button>
                                            )
                                        }}
                                    </CountDownTimer>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Col>
            </>)
    }

    return (
        <Row gutter={[0, 40]}>
            <Content />
        </Row>
    )
}

const ResetPage: AuthPage = () => {
    return (
        <RegisterContextProvider><ResetPageView /></RegisterContextProvider>
    )
}

ResetPage.headerAction = <ButtonHeaderAction descriptor={{ id: 'pages.auth.Register' }} path={'/auth/register'}/>

ResetPage.container = AuthLayout

export default ResetPage
