import { Col, Form, Input, Row, Space, Typography } from 'antd'
import MaskedInput from 'antd-mask-input'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { SMS_CODE_LENGTH, SMS_CODE_TTL } from '@condo/domains/user/constants/common'
import {
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED, TOO_MANY_REQUESTS,
} from '@condo/domains/user/constants/errors'
import { COMPLETE_CONFIRM_PHONE_MUTATION, RESEND_CONFIRM_PHONE_SMS_MUTATION } from '@condo/domains/user/gql'
import { RegisterContext } from './RegisterContextProvider'

const FORM_LAYOUT = {
    labelCol: { span: 10 },
    wrapperCol: { span: 14 },
}

interface IValidatePhoneFormProps {
    onFinish: () => void
    onReset: () => void
}

export const ValidatePhoneForm = ({ onFinish, onReset }): React.ReactElement<IValidatePhoneFormProps> => {
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
    const SMSTooManyRequestsError = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    const ErrorToFormFieldMsgMapping = useMemo(() => {
        return {
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
            [TOO_MANY_REQUESTS]: {
                name: 'smsCode',
                errors: [SMSTooManyRequestsError],
            },
        }
    }, [intl])

    const [form] = Form.useForm()
    const { token, phone, handleReCaptchaVerify } = useContext(RegisterContext)
    const [showPhone, setShowPhone] = useState(phone)
    const [isPhoneVisible, setIsPhoneVisible] = useState(false)
    const [phoneValidateError, setPhoneValidateError] = useState(null)
    const [resendSmsMutation] = useMutation(RESEND_CONFIRM_PHONE_SMS_MUTATION)
    const [completeConfirmPhoneMutation] = useMutation(COMPLETE_CONFIRM_PHONE_MUTATION)

    const PhoneToggleLabel = isPhoneVisible ? intl.formatMessage({ id: 'Hide' }) : intl.formatMessage({ id: 'Show' })


    const resendSms = useCallback(async () => {
        const sender = getClientSideSenderInfo()
        const captcha = await handleReCaptchaVerify('resend_sms')
        const variables = { data: { token, sender, captcha } }
        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: resendSmsMutation,
            variables,
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            console.error(error)
        })
    }, [intl, form, handleReCaptchaVerify, resendSmsMutation])

    const confirmPhone = useCallback(async () => {
        const smsCode = Number(form.getFieldValue('smsCode'))
        if (isNaN(smsCode)) {
            throw new Error(SMSBadFormat)
        }
        const captcha = await handleReCaptchaVerify('complete_verify_phone')
        const variables = { data: { token, smsCode, captcha } }
        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: completeConfirmPhoneMutation,
            variables,
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        })
    }, [intl, form, completeConfirmPhoneMutation])

    const handleVerifyCode = useCallback(async () => {
        setPhoneValidateError(null)
        let smsCode = form.getFieldValue('smsCode') || ''
        smsCode = smsCode.trim()
        if (smsCode.toString().length < SMS_CODE_LENGTH) {
            return
        }
        if (smsCode.toString().length > SMS_CODE_LENGTH) {
            return setPhoneValidateError(SMSCodeMismatchError)
        }
        try {
            await confirmPhone()
            onFinish()
        } catch (error) {
            console.error(error)
        }
    }, [confirmPhone])

    useEffect(() => {
        if (isPhoneVisible) {
            setShowPhone(formatPhone(phone))
        } else {
            const unHidden = formatPhone(phone)
            setShowPhone(`${unHidden.substring(0, 9)}***${unHidden.substring(12)}`)
        }
    }, [isPhoneVisible, phone, setShowPhone])

    const initialValues = { smsCode: '' }

    return (
        <Form
            {...FORM_LAYOUT}
            form={form}
            name='register-verify-code'
            initialValues={initialValues}
            colon={false}
            labelAlign='left'
            requiredMark={false}
        >
            <Row gutter={[0, 60]}>
                <Col span={24}>
                    <Space direction={'vertical'} size={24}>
                        <Typography.Text>
                            <FormattedMessage
                                id='pages.auth.register.info.SmsCodeSent'
                                values={{
                                    phone: (<span>{showPhone}<Button type={'inlineLink'} size={'small'} onClick={() => setIsPhoneVisible(!isPhoneVisible)}>({PhoneToggleLabel})</Button></span>),
                                }}
                            />
                        </Typography.Text>
                        <Button type={'inlineLink'} size={'small'} onClick={onReset}>
                            {ChangePhoneNumberLabel}
                        </Button>
                    </Space>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name='smsCode'
                        label={SmsCodeTitle}
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
                        <MaskedInput
                            mask='1111'
                            placeholder=''
                            placeholderChar=' '
                            onChange={handleVerifyCode}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <CountDownTimer action={resendSms} id={'RESEND_SMS'} timeout={SMS_CODE_TTL} autostart={true}>
                        {({ countdown, runAction }) => {
                            const isCountDownActive = countdown > 0
                            return (
                                <Space direction={'horizontal'} size={8}>
                                    <Button
                                        type={'inlineLink'}
                                        size={'small'}
                                        disabled={isCountDownActive}
                                        onClick={runAction}
                                    >
                                        {ResendSmsLabel}
                                    </Button>
                                    {isCountDownActive && (
                                        <Typography.Text type='secondary'>
                                            { `${new Date(countdown * 1000).toISOString().substr(14, 5)}` }
                                        </Typography.Text>
                                    )}
                                </Space>
                            )
                        }}
                    </CountDownTimer>
                </Col>
            </Row>
        </Form>
    )
}