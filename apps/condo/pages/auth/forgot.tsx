import { Form, Row, Col } from 'antd'
import Head from 'next/head'
import  { useRouter } from 'next/router'
import React, { useContext, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Button } from '@open-condo/ui'

import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { Loader } from '@condo/domains/common/components/Loader'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { colors } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { RegisterContext, RegisterContextProvider } from '@condo/domains/user/components/auth/RegisterContextProvider'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { SMS_CODE_TTL } from '@condo/domains/user/constants/common'
import { WRONG_PHONE_ERROR, TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { START_CONFIRM_PHONE_MUTATION } from '@condo/domains/user/gql'


const ROW_STYLES: React.CSSProperties = {
    justifyContent: 'center',
}
const FORM_PHONE_STYLES: React.CSSProperties = {
    borderRadius: 8,
    borderColor: colors.inputBorderGrey,
}

function ResetPageView () {
    const intl = useIntl()
    const router = useRouter()
    const RestorePasswordMsg = intl.formatMessage({ id: 'auth.reset.resetPasswordTitle' })
    const ResetTitleMsg = intl.formatMessage({ id: 'auth.resetTitle' })
    const InstructionsMsg = intl.formatMessage({ id: 'auth.reset.resetHelp' })
    const PhoneIsNotRegisteredMsg = intl.formatMessage({ id: 'auth.phoneIsNotRegistered' })
    const PhoneMsg = intl.formatMessage({ id: 'auth.register.field.phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.phone' })
    const TooManyRequestsMsg = intl.formatMessage({ id: 'tooManyRequests' })

    const REGISTER_PHONE_LABEL = <label style={ { alignSelf:'end' } }>{PhoneMsg}</label>

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
        [TOO_MANY_REQUESTS]: {
            name: 'phone',
            errors: [TooManyRequestsMsg],
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
                title={ResetTitleMsg}
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
            return <Loader size='large' />
        }

        return (
            <>
                <Head><title>{ResetTitleMsg}</title></Head>
                <Form
                    form={form}
                    name='forgot-password'
                    validateTrigger={['onBlur', 'onSubmit']}
                    initialValues={initialValues}
                    colon={false}
                    requiredMark={false}
                    layout='vertical'
                >
                    <Row style={ROW_STYLES}>
                        <ResponsiveCol span={24}>
                            <Row gutter={[0, 20]}>
                                <Col span={24}>
                                    <Typography.Title level={2}>{ResetTitleMsg}</Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Typography.Paragraph size='medium'>{InstructionsMsg}</Typography.Paragraph>
                                </Col>
                            </Row>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Form.Item
                                        name='phone'
                                        label={REGISTER_PHONE_LABEL}
                                        rules={validations.phone}
                                        data-cy='forgot-phone-item'
                                    >
                                        <PhoneInput style={FORM_PHONE_STYLES} placeholder={ExamplePhoneMsg} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item>
                                        <CountDownTimer action={startConfirmPhoneAction} id='FORGOT_ACTION' timeout={SMS_CODE_TTL}>
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
                                                        type='primary'
                                                        disabled={isCountDownActive}
                                                        loading={isLoading}
                                                        htmlType='submit'
                                                        block
                                                        data-cy='forgot-button'
                                                    >
                                                        {isCountDownActive ? `${RestorePasswordMsg} ${countdown}` : RestorePasswordMsg}
                                                    </Button>
                                                )
                                            }}
                                        </CountDownTimer>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </ResponsiveCol>
                    </Row>
                </Form>
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

ResetPage.container = AuthLayout

export default ResetPage
