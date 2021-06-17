import { useIntl } from '@core/next/intl'
import { FormattedMessage } from 'react-intl'
import Router, { useRouter } from 'next/router'
import { Form, Input, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout, { AuthLayoutContext, AuthPage } from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import React, { createContext, useEffect, useState, useContext } from 'react'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { 
    START_CONFIRM_PHONE_MUTATION,
    RESEND_CONFIRM_PHONE_SMS_MUTATION,
    COMPLETE_CONFIRM_PHONE_MUTATION,
    GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY,
    REGISTER_NEW_USER_MUTATION,
} from '@condo/domains/user/gql'
import { useLazyQuery } from '@core/next/apollo'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { useMutation } from '@core/next/apollo'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { 
    PHONE_ALREADY_REGISTERED_ERROR, 
    MIN_PASSWORD_LENGTH_ERROR, 
    EMAIL_ALREADY_REGISTERED_ERROR,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
} from '@condo/domains/user/constants/errors'
import { SMS_CODE_LENGTH } from '@condo/domains/user/constants/common'
import { colors } from '@condo/domains/common/constants/style'
import { SMS_CODE_TTL } from '@condo/domains/user/constants/common'
import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { isEmpty } from 'lodash'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'

const POLICY_LOCATION = '/policy.pdf'
const LINK_STYLE = { color: colors.sberPrimary[7] }
const INPUT_STYLE = { width: '20em' }
interface IRegisterContext {
    setconfirmPhoneActionToken: (token: string) => void,
    setPhone: (phone: string) => void,
    confirmPhoneActionToken: string,
    phone: string,
    tokenError: Error,
}

const RegisterContext = createContext<IRegisterContext>({
    setconfirmPhoneActionToken: (token) => null,
    setPhone: (phone) => null,
    confirmPhoneActionToken: '',
    phone: '',
    tokenError: null,
})

const Register = ({ children }): React.ReactElement => {
    const { query: { token } } = useRouter()
    const [confirmPhoneActionToken, setconfirmPhoneActionToken] = useState(token as string)
    const [phone, setPhone] = useState('')
    const [tokenError, setTokenError] = useState<Error | null>(null)
    useEffect(() => {
        if (!confirmPhoneActionToken) {
            setTokenError(null)
        }        
    }, [confirmPhoneActionToken])

    const [loadPhoneByToken] = useLazyQuery(
        GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY,
        {
            onError: error => {
                setTokenError(error)
            },
            onCompleted: ({ phone }) => {
                setPhone(phone)
            },
        })

    useEffect(() => {
        if (!isEmpty(confirmPhoneActionToken)) {
            loadPhoneByToken({ variables: { token: confirmPhoneActionToken } })
        } else {
            setPhone('')
        }
    }, [loadPhoneByToken, confirmPhoneActionToken])

    return (
        <RegisterContext.Provider
            value={{
                confirmPhoneActionToken,
                setconfirmPhoneActionToken,
                setPhone,
                phone,
                tokenError,
            }}
        >
            {children}
        </RegisterContext.Provider>
    )
}

const RegisterSteps = (): React.ReactElement => {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const PhoneConfirmTokenErrorLabel = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorLabel' })
    const PhoneConfirmTokenErrorMessage = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorMessage' })
    const RestartPhoneConfirmLabel = intl.formatMessage({ id: 'pages.auth.register.RestartPhoneConfirmLabel' })

    const { confirmPhoneActionToken, tokenError, setconfirmPhoneActionToken } = useContext(RegisterContext)
    const [state, setState] = useState(isEmpty(confirmPhoneActionToken) ? 'inputPhone' : 'validatePhone')

    if (tokenError && confirmPhoneActionToken) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {PhoneConfirmTokenErrorLabel}
                </Typography.Title>
                <Typography.Text style={{ fontSize: '16px' }}>
                    {PhoneConfirmTokenErrorMessage}
                </Typography.Text>
                <Button
                    type='sberPrimary'
                    style={{ marginTop: '16px' }}
                    onClick={() => {
                        setconfirmPhoneActionToken(null)
                        setState('inputPhone')
                        Router.push('/auth/register')
                    }}
                >
                    {RestartPhoneConfirmLabel}
                </Button>
            </BasicEmptyListView>
        )
    }
    const steps = {
        inputPhone: <InputPhoneForm onFinish={() => setState('validatePhone')} />,
        validatePhone: <ValidatePhoneForm onFinish={() => setState('register')} onReset={() => {
            setState('inputPhone')
            Router.push('/auth/register')
        }} />,
        register: <RegisterForm onFinish={() => null} />,
    }    
    return (
        <>
            <Typography.Title style={{ textAlign: 'left' }}>{RegistrationTitleMsg}</Typography.Title>
            {steps[state]}
        </>
    )
}

const RegisterPage: AuthPage = () => {
    return (
        <Register>
            <div style={{ textAlign: 'center' }}>
                <RegisterSteps />
            </div>
        </Register>
    )
}


interface IInputPhoneFormProps {
    onFinish: () => void
}

const InputPhoneForm = ({ onFinish }): React.ReactElement<IInputPhoneFormProps> => {
    const [form] = Form.useForm()
    const intl = useIntl()
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const RegisterHelpMessage = intl.formatMessage({ id: 'pages.auth.reset.RegisterHelp' })
    const UserAgreementFileName = intl.formatMessage({ id: 'pages.auth.register.info.UserAgreementFileName' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const { setconfirmPhoneActionToken, setPhone } = useContext(RegisterContext)
    const { handleReCaptchaVerify } = useContext(AuthLayoutContext)
    const [smsSendError, setSmsSendError] = useState(null)
    const [isloading, setIsLoading] = useState(false)
    const ErrorToFormFieldMsgMapping = {}
    const [startPhoneVerify] = useMutation(START_CONFIRM_PHONE_MUTATION)
    const startConfirmPhone = async () => {
        const registerExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        const { phone: inputPhone } = form.getFieldsValue(['phone'])
        const phone = normalizePhone(inputPhone)
        setPhone(phone)
        const captcha = await handleReCaptchaVerify('start-confirm-phone')
        const variables = { ...registerExtraData, phone, captcha }
        setIsLoading(true)
        return runMutation({
            mutation: startPhoneVerify,
            variables,
            onCompleted: (data) => {
                const { data: { token } } = data
                setconfirmPhoneActionToken(token)
                Router.push(`/auth/register?token=${token}`)
                onFinish()
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            setIsLoading(false)
        })
    }
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    return (
        <>
            <Typography.Paragraph style={{ textAlign: 'left', fontSize: '16px' }}>{RegisterHelpMessage}</Typography.Paragraph>
            <Form
                form={form}
                name='register-input-phone'
                onFinish={startConfirmPhone}
                colon={false}
                style={{ marginTop: '40px' }}
                requiredMark={false}
            >

                <Form.Item
                    name='phone'
                    label={PhoneMsg}
                    labelAlign='left'
                    style={{ marginTop: '40px', textAlign: 'left' }}
                    labelCol={{ flex: 1 }}
                    rules={[
                        {
                            required: true,
                            message: FieldIsRequiredMsg,
                        },
                        () => ({
                            validator () {
                                if (!smsSendError) {
                                    return Promise.resolve()
                                }
                                return Promise.reject(smsSendError)
                            },
                        }),
                    ]}
                >
                    <PhoneInput placeholder={ExamplePhoneMsg} onChange={() => setSmsSendError(null)} style={{ ...INPUT_STYLE }} />
                </Form.Item>
                <Typography.Paragraph style={{ textAlign: 'left', fontSize: '12px', marginTop: '40px', lineHeight: '20px' }}>
                    <FormattedMessage
                        id='pages.auth.register.info.UserAgreement'
                        values={{
                            link: <a style={LINK_STYLE} target='_blank' href={POLICY_LOCATION} rel='noreferrer'>{UserAgreementFileName}</a>,
                        }}
                    />
                </Typography.Paragraph>
                <Form.Item style={{ textAlign: 'left', marginTop: '24px' }}>
                    <Button
                        key='submit'
                        type='sberPrimary'
                        htmlType='submit'
                        loading={isloading}
                        style={{ marginTop: '40px' }}
                    >
                        {RegisterMsg}
                    </Button>
                </Form.Item>
            </Form>
        </>
    )
}

interface IValidatePhoneFormProps {
    onFinish: () => void
    onReset: () => void
}

const ValidatePhoneForm = ({ onFinish, onReset }): React.ReactElement<IValidatePhoneFormProps> => {
    const [form] = Form.useForm()
    const initialValues = { smsCode: '' }
    const intl = useIntl()
    const ChangePhoneNumberLabel = intl.formatMessage({ id: 'pages.auth.register.ChangePhoneNumber' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SmsCodeTitle = intl.formatMessage({ id: 'pages.auth.register.field.SmsCode' })
    const ResendSmsLabel = intl.formatMessage({ id: 'pages.auth.register.ResendSmsLabel' })

    const SMSCodeMismatchError = intl.formatMessage({ id: 'pages.auth.register.SMSCodeMismatchError' })
    const SMSExpiredError = intl.formatMessage({ id: 'pages.auth.register.SMSExpiredError' })
    const ConfirmActionExpiredError = intl.formatMessage({ id: 'pages.auth.register.ConfirmActionExpiredError' })
    const SMSMaxRetriesReachedError = intl.formatMessage({ id: 'pages.auth.register.SMSMaxRetriesReachedError' })
    const SMSBadFormat = intl.formatMessage({ id: 'pages.auth.register.SMSBadFormat' })
    
    const ErrorToFormFieldMsgMapping = {
        [CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED]: {
            name: 'smsCode',
            errors: [SMSCodeMismatchError],
        },
        [CONFIRM_PHONE_ACTION_EXPIRED]: {
            name: 'smsCode',
            errors: [ConfirmActionExpiredError],
        },
        [CONFIRM_PHONE_SMS_CODE_EXPIRED]: {
            name: 'smsCode',
            errors: [SMSExpiredError],
        },
        [CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED]: {
            name: 'smsCode',
            errors: [SMSMaxRetriesReachedError],
        },                
    }

    const [isPhoneVisible, setisPhoneVisible] = useState(false)
    const PhoneToggleLabel = isPhoneVisible ? intl.formatMessage({ id: 'Hide' }) : intl.formatMessage({ id: 'Show' })
    const { confirmPhoneActionToken, phone } = useContext(RegisterContext)
    const { handleReCaptchaVerify } = useContext(AuthLayoutContext)
    const [showPhone, setShowPhone] = useState(phone)
    useEffect(() => {
        if (isPhoneVisible) {
            setShowPhone(formatPhone(phone))
        } else {
            const unHidden = formatPhone(phone)
            setShowPhone(`${unHidden.substring(0, 9)}***${unHidden.substring(12)}`)
        }
    }, [isPhoneVisible, phone, setShowPhone])
    const [phoneValidateError, setPhoneValidateError] = useState(null)
    
    const [resendSmsMutation] = useMutation(RESEND_CONFIRM_PHONE_SMS_MUTATION)
    const resendSms = async () => {
        const sender = getClientSideSenderInfo()
        const captcha = await handleReCaptchaVerify('resend-sms')
        const variables = { token: confirmPhoneActionToken, sender, captcha }
        return runMutation({
            mutation: resendSmsMutation,
            variables,
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            console.error(error)
        })
    }
    const [completeConfirmPhoneMutation] = useMutation(COMPLETE_CONFIRM_PHONE_MUTATION)
    const confirmPhone = async () => {
        const smsCode = Number(form.getFieldValue('smsCode'))
        if (isNaN(smsCode)) {
            throw new Error(SMSBadFormat)
        }
        const captcha = await handleReCaptchaVerify('complete-verify-phone')
        const variables = { token: confirmPhoneActionToken, smsCode, captcha }
        return runMutation({
            mutation: completeConfirmPhoneMutation,
            variables,
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        })
    }    

    async function handleVerifyCode () {
        setPhoneValidateError(null)
        const smsCode = form.getFieldValue('smsCode') || ''
        if (smsCode.toString().length < SMS_CODE_LENGTH) {
            return
        }
        await confirmPhone()
        onFinish()
    }

    return (
        <>
            <Typography.Paragraph style={{ textAlign: 'left' }}>
                <FormattedMessage
                    id='pages.auth.register.info.SmsCodeSent'
                    values={{
                        phone: <span>{showPhone} <a style={LINK_STYLE} onClick={() => setisPhoneVisible(!isPhoneVisible)}>({PhoneToggleLabel})</a></span>,
                    }}
                />
            </Typography.Paragraph>
            <Form
                form={form}
                name='register-verify-code'
                initialValues={initialValues}
                colon={false}
                style={{ marginTop: '40px' }}
                requiredMark={false}
            >
                <Typography.Paragraph style={{ textAlign: 'left', marginTop: '32px' }}>
                    <a style={{ ...LINK_STYLE, fontSize: '12px', lineHeight: '20px' }} onClick={onReset}>{ChangePhoneNumberLabel}</a>
                </Typography.Paragraph>

                <Form.Item
                    name='smsCode'
                    label={SmsCodeTitle}
                    labelAlign='left'
                    style={{ marginTop: '40px', textAlign: 'left' }}
                    labelCol={{ flex: 1 }}
                    rules={[
                        {
                            required: true,
                            message: FieldIsRequiredMsg,
                        },
                        () => ({
                            validator () {
                                if (!phoneValidateError) {
                                    return Promise.resolve()
                                }
                                return Promise.reject(phoneValidateError)
                            },
                        }),
                    ]}
                >
                    <Input onChange={handleVerifyCode} style={INPUT_STYLE} />
                </Form.Item>
            </Form>
            <CountDownTimer action={resendSms} id={'RESEND_SMS'} timeout={SMS_CODE_TTL}>
                {({ countdown, runAction }) => {
                    const isCountDownActive = countdown > 0
                    return (
                        <Typography.Paragraph style={{ textAlign: 'left', marginTop: '60px' }}>
                            <a style={{ color: isCountDownActive ? colors.sberGrey[5] : colors.sberPrimary[7] }} onClick={runAction}>{ResendSmsLabel}</a>
                            {isCountDownActive && (
                                <Typography.Text  type='secondary' style={{ marginLeft: '10px' }}>
                                    { `${new Date(countdown * 1000).toISOString().substr(14, 5)}` }
                                </Typography.Text>
                            )}
                        </Typography.Paragraph>
                    )
                }}
            </CountDownTimer>
        </>
    )
}

interface IRegisterFormProps {
    onFinish: () => void
}

const RegisterForm = ({ onFinish }): React.ReactElement<IRegisterFormProps> => {
    const [form] = Form.useForm()
    const { phone, confirmPhoneActionToken } = useContext(RegisterContext)
    const [isLoading, setIsLoading] = useState(false)
    const { signInByPhone } = useContext(AuthLayoutContext)
    const initialValues = { phone }
    const intl = useIntl()
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const ExampleNameMsg = intl.formatMessage({ id: 'example.Name' })
    const EmailPlaceholder = intl.formatMessage({ id: 'example.Email' })
    const PleaseInputYourEmailMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourEmail' })
    const NameMsg = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.Password' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.ConfirmPassword' })
    const EmailMsg = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const AllFieldsAreRequired = intl.formatMessage({ id: 'pages.auth.register.AllFieldsAreRequired' })
    const PhoneIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsAlreadyRegistered' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const PleaseInputYourNameMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourName' })
    const EmailIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const EmailIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsAlreadyRegistered' })

    const ErrorToFormFieldMsgMapping = {
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
    const [registerMutation] = useMutation(REGISTER_NEW_USER_MUTATION)
    const registerComplete = async () => {
        const registerExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        const { name, email: inputEmail, password } = form.getFieldsValue(['name', 'email', 'password'])
        const email = inputEmail.toLowerCase().trim()
        const data = { name, email, password, ...registerExtraData, confirmPhoneActionToken }
        setIsLoading(true)
        return runMutation({
            mutation: registerMutation,
            variables: { data },
            onCompleted: () => {
                signInByPhone(form.getFieldsValue(['phone', 'password'])).then(() => { Router.push('/') }, console.error)
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            setIsLoading(false)
        })
    }
    return (
        <div>
            <Typography.Paragraph style={{ textAlign: 'left', fontSize: '12px' }} >{AllFieldsAreRequired}</Typography.Paragraph>
            <Form
                form={form}
                name='register'
                onFinish={registerComplete}
                initialValues={initialValues}
                colon={false}
                style={{ marginTop: '40px' }}
                requiredMark={false}
                validateTrigger={['onBlur', 'onSubmit']}
            >
                <Form.Item
                    name="phone"
                    label={PhoneMsg}
                    labelAlign='left'
                    style={{ marginTop: '24px', textAlign: 'left' }}
                    labelCol={{ flex: 1 }}
                    rules={[{ required: true }]}
                >
                    <PhoneInput disabled={true} placeholder={ExamplePhoneMsg} style={{ ...INPUT_STYLE }} />
                </Form.Item>
                <Form.Item
                    name='name'
                    label={NameMsg}
                    labelAlign='left'
                    style={{ marginTop: '24px', textAlign: 'left' }}
                    labelCol={{ flex: 1 }}
                    rules={[{ required: true, message: PleaseInputYourNameMsg, whitespace: true }]}
                >
                    <Input placeholder={ExampleNameMsg} style={INPUT_STYLE} />
                </Form.Item>
                <Form.Item
                    name='email'
                    label={EmailMsg}
                    labelAlign='left'
                    style={{ marginTop: '24px', textAlign: 'left' }}
                    labelCol={{ flex: 1 }}
                    rules={[
                        {
                            type: 'email',
                            message: EmailIsNotValidMsg,
                        },
                        {
                            required: true,
                            message: PleaseInputYourEmailMsg,
                        },
                    ]}
                >
                    <Input autoComplete='chrome-off' placeholder={EmailPlaceholder} style={INPUT_STYLE} />
                </Form.Item>
                <Form.Item
                    name='password'
                    label={PasswordMsg}
                    labelAlign='left'
                    style={{ marginTop: '24px', textAlign: 'left' }}
                    labelCol={{ flex: 1 }}
                    rules={[
                        {
                            required: true,
                            message: PleaseInputYourPasswordMsg,
                        },
                        {
                            min: MIN_PASSWORD_LENGTH,
                            message: PasswordIsTooShortMsg,
                        },
                    ]}
                >
                    <Input.Password autoComplete='new-password' style={INPUT_STYLE} />
                </Form.Item>
                <Form.Item
                    name='confirm'
                    label={ConfirmPasswordMsg}
                    labelAlign='left'
                    style={{ marginTop: '24px', textAlign: 'left' }}
                    labelCol={{ flex: 1 }}
                    dependencies={['password']}
                    rules={[
                        {
                            required: true,
                            message: PleaseConfirmYourPasswordMsg,
                        },
                        ({ getFieldValue }) => ({
                            validator (_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve()
                                }
                                return Promise.reject(TwoPasswordDontMatchMsg)
                            },
                        }),
                    ]}
                >
                    <Input.Password style={INPUT_STYLE} />
                </Form.Item>
                <Form.Item style={{ textAlign: 'left', marginTop: '36px' }}>
                    <Button
                        key='submit'
                        onClick={onFinish}
                        type='sberPrimary'
                        htmlType='submit'
                        loading={isLoading}
                    >
                        {RegisterMsg}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}


const HeaderAction = (): React.ReactElement => {
    const intl = useIntl()
    const AllreadyRegisteredTitle = intl.formatMessage({ id: 'pages.auth.AlreadyRegistered' })
    const { isMobile } = useContext(AuthLayoutContext)
    return (
        <Button
            key='submit'
            onClick={() => Router.push('/auth/signin')}
            type='sberPrimary'
            secondary={true}
            size={isMobile ? 'middle' : 'large'}
        >
            {AllreadyRegisteredTitle}
        </Button>
    )
}

RegisterPage.headerAction = <HeaderAction />

RegisterPage.container = AuthLayout

export default RegisterPage
