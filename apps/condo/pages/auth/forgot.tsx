import React, { useContext, useState } from 'react'
import { Form, Typography, Row, Col } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import  { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { START_CONFIRM_PHONE_MUTATION } from '@condo/domains/user/gql'
import { WRONG_PHONE_ERROR, TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { SMS_CODE_TTL } from '@condo/domains/user/constants/common'
import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { RegisterContext, RegisterContextProvider } from '@condo/domains/user/components/auth/RegisterContextProvider'
import { Loader } from '@condo/domains/common/components/Loader'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { colors } from '@condo/domains/common/constants/style'

const ROW_STYLES: React.CSSProperties = {
    justifyContent: 'center',
    textAlign: 'center',
}
const FORM_TITLE_STYLES: React.CSSProperties = { textAlign: 'left', fontWeight: 700 }
const FORM_PHONE_STYLES: React.CSSProperties = { borderRadius: 8, borderColor: colors.inputBorderGrey }

function ResetPageView () {
    const intl = useIntl()
    const router = useRouter()
    const RestorePasswordMsg = intl.formatMessage({ id: 'pages.auth.reset.RestorePasswordTitle' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const InstructionsMsg = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp' })
    const PhoneIsNotRegisteredMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsNotRegistered' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const TooManyRequestsMsg = intl.formatMessage({ id: 'TooManyRequests' })

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
                title={ResetTitle}
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
                <Form
                    form={form}
                    name='forgot-password'
                    validateTrigger={['onBlur', 'onSubmit']}
                    initialValues={initialValues}
                    colon={false}
                    requiredMark={false}
                    layout={'vertical'}
                >
                    <Row style={ROW_STYLES}>
                        <ResponsiveCol span={24}>
                            <Row gutter={[0, 20]}>
                                <Col span={24}>
                                    <Typography.Title level={3} style={FORM_TITLE_STYLES}>{ResetTitle}</Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Typography.Paragraph style={{ textAlign: 'left' }}>{InstructionsMsg}</Typography.Paragraph>
                                </Col>
                            </Row>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Form.Item
                                        name='phone'
                                        label={REGISTER_PHONE_LABEL}
                                        rules={validations.phone}
                                        data-cy={'forgot-phone-item'}
                                    >
                                        <PhoneInput style={FORM_PHONE_STYLES} placeholder={ExamplePhoneMsg} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item>
                                        <CountDownTimer action={startConfirmPhoneAction} id={'FORGOT_ACTION'} timeout={SMS_CODE_TTL}>
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
                                                        type={isCountDownActive ? 'sberGrey' : 'sberDefaultGradient'}
                                                        disabled={isCountDownActive}
                                                        loading={isLoading}
                                                        htmlType='submit'
                                                        style={{ width: '100%' }}
                                                        data-cy={'forgot-button'}
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
ResetPage.headerAction = <></>
ResetPage.container = AuthLayout

export default ResetPage
