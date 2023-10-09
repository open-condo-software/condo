import { Form, Row, Col } from 'antd'
import { phone as parsePhone } from 'phone'
import React, { useCallback, useState } from 'react'
import { useIntl, FormattedMessage } from 'react-intl'
import { useCountdown } from 'usehooks-ts'

import { Input, Button, Typography } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { CONFIRM_ACTION_TTL_IN_SEC } from '@dev-api/domains/user/constants'
import { INVALID_PHONE } from '@dev-api/domains/user/constants/errors'

import styles from './RegisterForm.module.css'

import { useStartConfirmPhoneActionMutation } from '@/lib/gql'

const RAW_PHONE_REGEXP = /^\+\d+$/
// NOTE: ConfirmPhoneAction is valid for 5 min, but registration form filling time is included in it
// So, we need to cut this time a bit, so user can resend code earlier (in case on delivery failure)
const RESET_MAX_TIMEOUT_IN_SEC = 90
const RESET_TIMEOUT_IN_SEC = Math.min(RESET_MAX_TIMEOUT_IN_SEC, CONFIRM_ACTION_TTL_IN_SEC)
const FUL_SPAN_COL = 24
const START_CONFIRM_PHONE_ACTION_ERRORS_TO_FIELDS_MAP = {
    [INVALID_PHONE]: 'phone',
}

type ConfirmActionType =  {
    phone: string
    actionId: string
}

function hidePhone (phone: string) {
    const isRaw = RAW_PHONE_REGEXP.test(phone) || phone.indexOf(' ') === -1

    // NOTE: If raw format - extract country code and mask everything else except last 2 digits
    // E.g. +123456789 -> +1*******89
    if (isRaw) {
        const data = parsePhone(phone)
        // +1********
        const begin = data.countryCode?.length || 2
        const end = 4
        return `${phone.substring(0, begin)}${'*'.repeat(phone.length - begin - end)}${phone.substring(phone.length - end)}`
    }


    // Extract country prefix and mask everything else except last 2 digits
    // E.g +7 (123) 123-45-67 -> +7 (***) ***-**-67
    // E.g +44 1231 231231 -> +44 **** ****31
    // E.g +44 1231 231231 5 -> +44 **** ****** 5
    const countryEnd = phone.indexOf(' ')
    const chars = [phone.substring(0, countryEnd)]
    for (let i = countryEnd; i < phone.length - 2; i++) {
        chars.push(phone[i] >= '0' && phone[i] <= '9' ? '*' : phone[i])
    }
    chars.push(phone.substring(phone.length - 2))

    return chars.join('')
}

function formatCountDown (ttl: number): string {
    const seconds = `${ttl % 60}`.padStart(2, '0')
    const minutes = `${Math.floor(ttl / 60)}`.padStart(2, '0')
    return `${minutes}:${seconds}`
}

export const RegisterForm: React.FC = () => {
    const intl = useIntl()
    const PhoneLabel = intl.formatMessage({ id: 'global.authForm.labels.phone' })
    const SignUpButtonLabel = intl.formatMessage({ id: 'global.action.signUp' })
    const PrivacyPolicyText = intl.formatMessage({ id: 'global.registerForm.personalDataProcessing.privacyPolicy' })
    const ConsentText = intl.formatMessage({ id: 'global.registerForm.personalDataProcessing.consent' })
    const PersonalDataProcessingMessage = intl.formatMessage({ id: 'global.registerForm.personalDataProcessing.warning' }, {
        signUpButton: SignUpButtonLabel,
        privacyPolicyLink: (
            <Typography.Link href='/policy.pdf' target='_blank'>{PrivacyPolicyText}</Typography.Link>
        ),
        consentLink: (
            <Typography.Link href='/pdpc.pdf' target='_blank'>{ConsentText}</Typography.Link>
        ),
    })
    const HidePhoneMessage = intl.formatMessage({ id: 'global.registerForm.phone.hide' })
    const ShowPhoneMessage = intl.formatMessage({ id: 'global.registerForm.phone.show' })
    const SMSCodeFieldLabel = intl.formatMessage({ id: 'global.registerForm.labels.code' })
    const ChangePhoneNumberMessage = intl.formatMessage({ id: 'global.registerForm.changeNumber.message' })
    const ResendCodeMessage = intl.formatMessage({ id: 'global.registerForm.action.resendSMS' })

    const [confirmAction, setConfirmAction] = useState<ConfirmActionType | null>(null)
    const [isPhoneConfirmed, setIsPhoneConfirmed] = useState(false)
    const [formattedPhone, setFormattedPhone] = useState<string | undefined>(undefined)

    const [isPhoneHidden, setIsPhoneHidden] = useState(true)
    const [actionTTL, { startCountdown, resetCountdown }] = useCountdown({
        countStart: RESET_TIMEOUT_IN_SEC,
        intervalMs: 1000,
    })

    const switchPhoneVisibility = useCallback(() => {
        setIsPhoneHidden(prev => !prev)
    }, [])

    const onPhoneInputChange = useCallback((value, opts, evt, maskedValue) => {
        setFormattedPhone(maskedValue)
    }, [])

    const resetAction = useCallback(() => {
        setConfirmAction(null)
    }, [])

    const [phoneForm] = Form.useForm()
    const [codeForm] = Form.useForm()

    const { phoneFormatValidator } = useValidations()

    const onStartConfirmPhoneActionError = useMutationErrorHandler({
        form: phoneForm,
        typeToFieldMapping: START_CONFIRM_PHONE_ACTION_ERRORS_TO_FIELDS_MAP,
    })
    const [startConfirmPhoneActionMutation] = useStartConfirmPhoneActionMutation({
        onCompleted: (data) => {
            if (data.startConfirmPhoneAction?.actionId && data.startConfirmPhoneAction.phone) {
                setConfirmAction({
                    phone: data.startConfirmPhoneAction.phone,
                    actionId: data.startConfirmPhoneAction.actionId,
                })
                setIsPhoneHidden(true)
                startCountdown()
            }
        },
        onError: onStartConfirmPhoneActionError,
    })

    const startConfirmPhoneAction = useCallback((values) => {
        const data = {
            ...values,
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        startConfirmPhoneActionMutation({ variables: { data } })
    }, [startConfirmPhoneActionMutation])

    const resendConfirmPhoneAction = useCallback(() => {
        if (confirmAction) {
            resetCountdown()
            startConfirmPhoneAction({ phone: confirmAction.phone })
        }
    }, [confirmAction, startConfirmPhoneAction, resetCountdown])


    if (!confirmAction) {
        return (
            <Form
                name='register-phone'
                layout='vertical'
                requiredMark={false}
                form={phoneForm}
                onFinish={startConfirmPhoneAction}
            >
                <Row>
                    <Col span={FUL_SPAN_COL}>
                        <Form.Item name='phone' label={PhoneLabel} rules={[phoneFormatValidator]}>
                            <Input.Phone onChange={onPhoneInputChange}/>
                        </Form.Item>
                    </Col>
                    <Col span={FUL_SPAN_COL}>
                        <Typography.Paragraph type='secondary' size='small'>
                            {PersonalDataProcessingMessage}
                        </Typography.Paragraph>
                    </Col>
                    <Col span={FUL_SPAN_COL} className={styles.submitButtonCol}>
                        <Button type='primary' block htmlType='submit'>
                            {SignUpButtonLabel}
                        </Button>
                    </Col>
                </Row>
            </Form>
        )
    }

    if (!isPhoneConfirmed) {
        return (
            <Form
                name='register-code'
                layout='vertical'
                requiredMark={false}
                form={codeForm}
            >
                <Row>
                    <Col span={FUL_SPAN_COL}>
                        <Typography.Paragraph size='medium'>
                            <FormattedMessage
                                id='global.registerForm.SMSSent.message'
                                values={{ phone: isPhoneHidden
                                    ? hidePhone(formattedPhone || confirmAction.phone)
                                    : formattedPhone || confirmAction.phone,
                                }}
                            />
                            &nbsp;
                            (<Typography.Link onClick={switchPhoneVisibility}>{isPhoneHidden ? ShowPhoneMessage : HidePhoneMessage}</Typography.Link>)
                        </Typography.Paragraph>
                    </Col>
                    <Col span={FUL_SPAN_COL} className={styles.messageSentCol}>
                        <Typography.Link onClick={resetAction}>{ChangePhoneNumberMessage}</Typography.Link>
                    </Col>
                    <Col span={FUL_SPAN_COL}>
                        <Form.Item name='code' label={SMSCodeFieldLabel}>
                            <Input inputMode='numeric' pattern='[0-9]*' placeholder='1234'/>
                        </Form.Item>
                    </Col>
                    <Col span={FUL_SPAN_COL}>
                        {actionTTL > 0 ? (
                            <Typography.Text size='medium'>
                                <FormattedMessage
                                    id='global.registerForm.action.alive.message'
                                    values={{ ttl: formatCountDown(actionTTL) }}
                                />
                            </Typography.Text>
                        ) : (
                            <Typography.Link onClick={resendConfirmPhoneAction}>
                                {ResendCodeMessage}
                            </Typography.Link>
                        )}
                    </Col>
                </Row>
            </Form>
        )
    }

    return null
}