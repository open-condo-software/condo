import { Col, Form, Row, Space, Typography as DefaultTypography, RowProps } from 'antd'
import React, { CSSProperties, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { FormattedMessage } from '@open-condo/next/intl'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { colors } from '@condo/domains/common/constants/style'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { SMS_CODE_LENGTH, SMS_CODE_TTL } from '@condo/domains/user/constants/common'
import {
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED, TOO_MANY_REQUESTS,
} from '@condo/domains/user/constants/errors'
import { COMPLETE_CONFIRM_PHONE_MUTATION, RESEND_CONFIRM_PHONE_SMS_MUTATION } from '@condo/domains/user/gql'

import { RegisterContext } from './RegisterContextProvider'


const ROW_STYLES: React.CSSProperties = {
    justifyContent: 'center',
}

interface IValidatePhoneFormProps {
    onFinish: () => void
    onReset: () => void
    title: string
}

const SMS_CODE_CLEAR_REGEX = /[^0-9]/g
const BUTTON_FORM_GUTTER: RowProps['gutter'] = [0, 40]
const FORM_ITEMS_GUTTER: RowProps['gutter'] = [0, 24]
const INPUT_STYLE: CSSProperties = { maxWidth: '120px' }

export const ValidatePhoneForm = ({ onFinish, onReset, title }): React.ReactElement<IValidatePhoneFormProps> => {
    const intl = useIntl()
    const ChangePhoneNumberLabel = intl.formatMessage({ id: 'pages.auth.register.ChangePhoneNumber' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SmsCodeTitle = intl.formatMessage({ id: 'pages.auth.register.field.SmsCode' })
    const ResendSmsLabel = intl.formatMessage({ id: 'pages.auth.register.ResendSmsLabel' })
    const SMSAvailableLabel = intl.formatMessage({ id: 'pages.auth.register.CodeIsAvailable' })
    const SMSCodeMismatchError = intl.formatMessage({ id: 'pages.auth.register.SMSCodeMismatchError' })
    const SMSExpiredError = intl.formatMessage({ id: 'pages.auth.register.SMSExpiredError' })
    const ConfirmActionExpiredError = intl.formatMessage({ id: 'pages.auth.register.ConfirmActionExpiredError' })
    const SMSMaxRetriesReachedError = intl.formatMessage({ id: 'pages.auth.register.SMSMaxRetriesReachedError' })
    const SMSBadFormat = intl.formatMessage({ id: 'pages.auth.register.SMSBadFormat' })
    const SMSTooManyRequestsError = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    // TODO(DOMA-3293): remove this legacy error style and Useless error messages
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
    const { token, phone, handleCaptchaVerify } = useContext(RegisterContext)
    const [showPhone, setShowPhone] = useState(phone)
    const [isPhoneVisible, setIsPhoneVisible] = useState(false)
    const [phoneValidateError, setPhoneValidateError] = useState(null)
    const [resendSmsMutation] = useMutation(RESEND_CONFIRM_PHONE_SMS_MUTATION)
    const [completeConfirmPhoneMutation] = useMutation(COMPLETE_CONFIRM_PHONE_MUTATION)
    const PhoneToggleLabel = isPhoneVisible ? intl.formatMessage({ id: 'Hide' }) : intl.formatMessage({ id: 'Show' })

    const SMS_VALIDATOR = useCallback(() => ({
        validator () {
            if (!phoneValidateError) {
                return Promise.resolve()
            }
            return Promise.reject(phoneValidateError)
        },
    }), [phoneValidateError])

    const SMS_CODE_VALIDATOR_RULES = useMemo(() => [
        { required: true, message: FieldIsRequiredMsg }, SMS_VALIDATOR], [FieldIsRequiredMsg, SMS_VALIDATOR])

    const resendSms = useCallback(async () => {
        const sender = getClientSideSenderInfo()
        const captcha = await handleCaptchaVerify()
        const variables = { data: { token, sender, captcha, dv: 1 } }
        return runMutation({
            mutation: resendSmsMutation,
            variables,
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            console.error(error)
        })
    }, [intl, form, handleCaptchaVerify, resendSmsMutation])

    const confirmPhone = useCallback(async () => {
        const sender = getClientSideSenderInfo()
        const smsCode = Number(form.getFieldValue('smsCode'))
        if (isNaN(smsCode)) {
            throw new Error(SMSBadFormat)
        }
        const captcha = await handleCaptchaVerify()
        const variables = { data: { token, smsCode, captcha, dv: 1, sender } }
        return runMutation({
            mutation: completeConfirmPhoneMutation,
            variables,
            intl,
            form,
            // Skip notification
            OnCompletedMsg: null,
            ErrorToFormFieldMsgMapping,
        })
    }, [intl, form, completeConfirmPhoneMutation])

    const handleVerifyCode = useCallback(async () => {
        setPhoneValidateError(null)
        let smsCode = (form.getFieldValue('smsCode') || '').toString()
        smsCode = smsCode.replace(SMS_CODE_CLEAR_REGEX, '')
        form.setFieldsValue({ smsCode })
        if (smsCode.length < SMS_CODE_LENGTH) {
            return
        }
        if (smsCode.length > SMS_CODE_LENGTH) {
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
        const formattedPhone = formatPhone(phone)
        const phoneVisible = isPhoneVisible ? formattedPhone : `${formattedPhone.substring(0, 9)}***${formattedPhone.substring(12)}`
        setShowPhone(phoneVisible)
    }, [isPhoneVisible, phone, setShowPhone])

    const initialValues = { smsCode: '' }

    return (
        <Form
            form={form}
            name='register-verify-code'
            initialValues={initialValues}
            colon={false}
            labelAlign='left'
            requiredMark={false}
            layout='vertical'
        >
            <Row gutter={BUTTON_FORM_GUTTER} style={ROW_STYLES}>
                <ResponsiveCol span={24}>
                    <Row gutter={FORM_ITEMS_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={2}>{title}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <DefaultTypography.Text>
                                <FormattedMessage
                                    id='pages.auth.register.info.SmsCodeSent'
                                    values={{
                                        phone: (
                                            <span style={{ whiteSpace: 'nowrap' }}>
                                                {`${formatPhone(showPhone)} `}
                                                <DefaultTypography.Link
                                                    underline
                                                    style={{ color: 'black' }}
                                                    onClick={() => setIsPhoneVisible(!isPhoneVisible)}
                                                >
                                                    ({PhoneToggleLabel})
                                                </DefaultTypography.Link>
                                            </span>),
                                    }}
                                />
                            </DefaultTypography.Text>
                        </Col>
                        <Col span={24}>
                            <DefaultTypography.Link underline style={{ color: colors.textSecondary }} onClick={onReset}>
                                {ChangePhoneNumberLabel}
                            </DefaultTypography.Link>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='smsCode'
                                label={SmsCodeTitle}
                                data-cy='register-smscode-item'
                                rules={SMS_CODE_VALIDATOR_RULES}
                            >
                                <Input
                                    placeholder=''
                                    inputMode='numeric'
                                    pattern='[0-9]*'
                                    onChange={handleVerifyCode}
                                    style={INPUT_STYLE}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </ResponsiveCol>
                <ResponsiveCol span={24}>
                    <CountDownTimer action={resendSms} id='RESEND_SMS' timeout={SMS_CODE_TTL} autostart={true}>
                        {({ countdown, runAction }) => {
                            const isCountDownActive = countdown > 0
                            return (
                                isCountDownActive ?

                                    <Space direction='horizontal' size={8}>
                                        <DefaultTypography.Link
                                            style={{ color: colors.textSecondary }}
                                            disabled={true}
                                        >
                                            {SMSAvailableLabel}
                                        </DefaultTypography.Link>
                                        <DefaultTypography.Text type='secondary'>
                                            {`${new Date(countdown * 1000).toISOString().substr(14, 5)}`}
                                        </DefaultTypography.Text>
                                    </Space>

                                    :

                                    <DefaultTypography.Link
                                        underline
                                        style={{ color: colors.textSecondary }}
                                        onClick={runAction}
                                    >
                                        {ResendSmsLabel}
                                    </DefaultTypography.Link>

                            )
                        }}
                    </CountDownTimer>
                </ResponsiveCol>
            </Row>
        </Form>
    )
}
