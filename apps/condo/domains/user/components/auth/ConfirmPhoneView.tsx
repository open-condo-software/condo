import { Col, Form, Row, Space, Typography } from 'antd'
import MaskedInput from 'antd-mask-input'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useConfirmIdentityContext } from '@condo/domains/user/components/auth/ConfirmIdentityContext'
import { FORM_LAYOUT } from '@condo/domains/user/constants/layout'
import { CAPTCHA_ACTIONS } from '@condo/domains/user/utils/captchaActions'
import { RegisterPageStep } from './register/RegisterPageStep'
import { Loader } from '@condo/domains/common/components/Loader'

export function ConfirmPhoneView () {
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
    const { token, tokenLoading, tokenError, isConfirmed, setIsConfirmed, forgetToken, phone, handleReCaptchaVerify, pageStore, setStep } = useConfirmIdentityContext()
    const [showPhone, setShowPhone] = useState(phone)
    const [isPhoneVisible, setIsPhoneVisible] = useState(false)
    const [phoneValidateError, setPhoneValidateError] = useState(null)
    const [resendSmsMutation] = useMutation(RESEND_CONFIRM_PHONE_SMS_MUTATION)
    const [completeConfirmPhoneMutation] = useMutation(COMPLETE_CONFIRM_PHONE_MUTATION)

    const PhoneToggleLabel = isPhoneVisible ? intl.formatMessage({ id: 'Hide' }) : intl.formatMessage({ id: 'Show' })

    const resendSms = useCallback(async () => {
        const sender = getClientSideSenderInfo()
        const captcha = await handleReCaptchaVerify(CAPTCHA_ACTIONS.RESEND_SMS)
        const variables = { data: { token, sender, captcha } }
        return runMutation({
            mutation: resendSmsMutation,
            variables,
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            console.error(error)
        })
    }, [handleReCaptchaVerify, token, resendSmsMutation, intl, form, ErrorToFormFieldMsgMapping])

    useEffect(() => {
        console.log('confirm phone view', tokenLoading, token, phone)
        if (tokenLoading) return
        if (!token || !phone) {
            setStep(RegisterPageStep.EnterPhone)
        }
        if (token && isConfirmed) {
            setStep(RegisterPageStep.FillCredentials)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenLoading])

    const confirmPhone = useCallback(async () => {
        const smsCode = Number(form.getFieldValue('smsCode'))
        if (isNaN(smsCode)) {
            throw new Error(SMSBadFormat)
        }
        const captcha = await handleReCaptchaVerify(CAPTCHA_ACTIONS.COMPLETE_VERIFY_PHONE)
        const variables = { data: { token, smsCode, captcha } }
        return runMutation({
            mutation: completeConfirmPhoneMutation,
            variables,
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        })
    }, [form, handleReCaptchaVerify, token, completeConfirmPhoneMutation, intl, ErrorToFormFieldMsgMapping, SMSBadFormat])

    const changePhone = useCallback(() => {
        forgetToken()
        setStep(RegisterPageStep.EnterPhone)
    }, [forgetToken, setStep])

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
            setIsConfirmed(true)
            setStep(RegisterPageStep.FillCredentials)
        } catch (error) {
            console.error(error)
        }
    }, [SMSCodeMismatchError, confirmPhone, form])

    useEffect(() => {
        if (tokenLoading) return
        if (!token || tokenError || phone.length === 0) {
            setStep(RegisterPageStep.EnterPhone)
        }
        else if (isConfirmed) {
            setStep(RegisterPageStep.FillCredentials)
        }
    }, [tokenLoading])

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
                        <Button type={'inlineLink'} size={'small'} onClick={changePhone}>
                            {ChangePhoneNumberLabel}
                        </Button>
                    </Space>
                </Col>
                <Col span={24}>
                    {!tokenLoading ?
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
                        </Form.Item> : <Loader />}
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
                                            {`${new Date(countdown * 1000).toISOString().substr(14, 5)}`}
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