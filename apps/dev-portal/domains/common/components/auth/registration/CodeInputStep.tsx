import { Col, Form, Row } from 'antd'
import { phone as parsePhone } from 'phone'
import React, { useCallback, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Typography, Input } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { CONFIRM_ACTION_CODE_LENGTH } from '@dev-api/domains/user/constants'

import styles from './CodeInputStep.module.css'

import { useStartConfirmPhoneActionMutation } from '@/lib/gql'


const FULL_SPAN_COL = 24
const RAW_PHONE_REGEXP = /^\+\d+$/


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

type CodeInputStepProps = {
    phone: string
    formattedPhone?: string
    actionTTL: number
    phoneChangeAction: () => void
    resetCountDown: () => void
    startCountDown: () => void
}

export const CodeInputStep: React.FC<CodeInputStepProps> = ({
    phone,
    formattedPhone,
    actionTTL,
    phoneChangeAction,
    resetCountDown,
    startCountDown,
}) => {
    const intl = useIntl()
    const HidePhoneMessage = intl.formatMessage({ id: 'global.registerForm.phone.hide' })
    const ShowPhoneMessage = intl.formatMessage({ id: 'global.registerForm.phone.show' })
    const SMSCodeFieldLabel = intl.formatMessage({ id: 'global.registerForm.labels.code' })
    const ChangePhoneNumberMessage = intl.formatMessage({ id: 'global.registerForm.changeNumber.message' })
    const ResendCodeMessage = intl.formatMessage({ id: 'global.registerForm.action.resendSMS' })
    const [isPhoneHidden, setIsPhoneHidden] = useState(true)

    const [form] = Form.useForm()

    const switchPhoneVisibility = useCallback(() => {
        setIsPhoneHidden(prev => !prev)
    }, [])

    const onError = useMutationErrorHandler()
    const onCompleted = useCallback(() => {
        resetCountDown()
        startCountDown()
    }, [resetCountDown, startCountDown])
    const [restartConfirmPhoneAction] = useStartConfirmPhoneActionMutation({
        onError,
        onCompleted,
    })

    const handleResendCode = useCallback(() => {
        const data = {
            phone,
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        restartConfirmPhoneAction({
            variables: { data },
        })
    }, [restartConfirmPhoneAction, phone])

    const handleCodeValueChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        let value = event.target.value
        if (value.length === CONFIRM_ACTION_CODE_LENGTH) {
            console.log('SUBMITTT')
            form.submit()
        } else if (value.length > CONFIRM_ACTION_CODE_LENGTH) {
            value = value.substring(0, CONFIRM_ACTION_CODE_LENGTH)
            console.log(value)
            form.setFieldsValue([{ name: 'code', value }])
        }
    }, [form])
    
    return (
        <Form
            name='register-code'
            layout='vertical'
            requiredMark={false}
            form={form}
            onFinish={console.log}
        >
            <Row>
                <Col span={FULL_SPAN_COL}>
                    <Typography.Paragraph size='medium'>
                        <FormattedMessage
                            id='global.registerForm.SMSSent.message'
                            values={{ phone: isPhoneHidden
                                ? hidePhone(formattedPhone || phone)
                                : formattedPhone || phone,
                            }}
                        />
                        &nbsp;
                        (<Typography.Link onClick={switchPhoneVisibility}>{isPhoneHidden ? ShowPhoneMessage : HidePhoneMessage}</Typography.Link>)
                    </Typography.Paragraph>
                </Col>
                <Col span={FULL_SPAN_COL} className={styles.messageSentCol}>
                    <Typography.Link onClick={phoneChangeAction}>{ChangePhoneNumberMessage}</Typography.Link>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='code' label={SMSCodeFieldLabel}>
                        <Input inputMode='numeric' pattern='[0-9]*' placeholder='1234' onChange={handleCodeValueChange} maxLength={4}/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    {actionTTL > 0 ? (
                        <Typography.Text size='medium'>
                            <FormattedMessage
                                id='global.registerForm.action.alive.message'
                                values={{ ttl: formatCountDown(actionTTL) }}
                            />
                        </Typography.Text>
                    ) : (
                        <Typography.Link onClick={handleResendCode}>
                            {ResendCodeMessage}
                        </Typography.Link>
                    )}
                </Col>
            </Row>
        </Form>
    )
}