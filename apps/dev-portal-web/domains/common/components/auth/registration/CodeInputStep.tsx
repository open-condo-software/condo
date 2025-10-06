import { Col, Form, Row } from 'antd'
import { phone as parsePhone } from 'phone'
import React, { useCallback, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Typography, Input } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { CONFIRM_PHONE_ACTION_CODE_LENGTH } from '@dev-portal-api/domains/user/constants'
import { INVALID_CODE, ACTION_NOT_FOUND } from '@dev-portal-api/domains/user/constants/errors'

import styles from './CodeInputStep.module.css'

import { useCompleteConfirmPhoneActionMutation, useStartConfirmPhoneActionMutation, StartConfirmPhoneActionMutation } from '@/gql'

const CODE_PLACEHOLDER = [...Array(CONFIRM_PHONE_ACTION_CODE_LENGTH).keys()].map(idx => idx + 1).join('')
const FULL_SPAN_COL = 24
const RAW_PHONE_REGEXP = /^\+\d+$/
const CODE_FORM_ERRORS_TO_FIELDS_MAP = {
    [INVALID_CODE]: 'code',
    [ACTION_NOT_FOUND]: 'code',
}


function hidePhone (phone: string) {
    const isRaw = RAW_PHONE_REGEXP.test(phone) || phone.indexOf(' ') === -1

    // NOTE: If raw format - extract country code and mask everything else except last 2 digits
    // E.g. +123456789 -> +1*******89
    if (isRaw) {
        const data = parsePhone(phone)
        // +1********
        const begin = data.countryCode?.length || 2
        const end = 2
        return `${phone.substring(0, begin)}${'*'.repeat(phone.length - begin - end)}${phone.substring(phone.length - end)}`
    }


    // Extract country prefix and mask everything else except last 2 characters
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

type CodeFormValues = {
    code: string
}

type CodeInputStepProps = {
    phone: string
    actionId: string
    formattedPhone?: string
    actionTTL: number
    phoneChangeAction: () => void
    onCodeResendComplete: (newActionId: string) => void
    onComplete: () => void
}

export const CodeInputStep: React.FC<CodeInputStepProps> = ({
    phone,
    actionId,
    formattedPhone,
    actionTTL,
    phoneChangeAction,
    onCodeResendComplete,
    onComplete,
}) => {
    const intl = useIntl()
    const HidePhoneMessage = intl.formatMessage({ id: 'components.common.registerForm.actions.phone.hide' })
    const ShowPhoneMessage = intl.formatMessage({ id: 'components.common.registerForm.actions.phone.show' })
    const SMSCodeFieldLabel = intl.formatMessage({ id: 'components.common.registerForm.items.code.label' })
    const ChangePhoneNumberMessage = intl.formatMessage({ id: 'components.common.registerForm.actions.changePhone' })
    const ResendCodeMessage = intl.formatMessage({ id: 'components.common.registerForm.actions.resendSMS' })
    const [isPhoneHidden, setIsPhoneHidden] = useState(true)

    const [form] = Form.useForm()

    const switchPhoneVisibility = useCallback(() => {
        setIsPhoneHidden(prev => !prev)
    }, [])

    const onResendActionError = useMutationErrorHandler()
    const onResendActionCompleted = useCallback((data: StartConfirmPhoneActionMutation) => {
        if (data.startConfirmPhoneAction?.actionId) {
            onCodeResendComplete(data.startConfirmPhoneAction.actionId)
        }
    }, [onCodeResendComplete])
    const [restartConfirmPhoneAction] = useStartConfirmPhoneActionMutation({
        onError: onResendActionError,
        onCompleted: onResendActionCompleted,
    })

    const onCompleteConfirmPhoneActionError = useMutationErrorHandler({
        form,
        typeToFieldMapping: CODE_FORM_ERRORS_TO_FIELDS_MAP,
    })
    const onCompleteConfirmPhoneActionCompleted = useCallback(() => { onComplete() }, [onComplete])
    const [completeConfirmPhoneActionMutation] = useCompleteConfirmPhoneActionMutation({
        onError: onCompleteConfirmPhoneActionError,
        onCompleted: onCompleteConfirmPhoneActionCompleted,
    })
    const completeConfirmPhoneAction = useCallback((values: CodeFormValues) => {
        const data = {
            dv: 1,
            sender: getClientSideSenderInfo(),
            actionId,
            code: values.code,
        }
        completeConfirmPhoneActionMutation({ variables: { data } })
    }, [completeConfirmPhoneActionMutation, actionId])

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
        let value = event.target.value
        if (value.length === CONFIRM_PHONE_ACTION_CODE_LENGTH) {
            form.submit()
        } else if (value.length > CONFIRM_PHONE_ACTION_CODE_LENGTH) {
            value = value.substring(0, CONFIRM_PHONE_ACTION_CODE_LENGTH)
            form.setFieldsValue([{ name: 'code', value }])
        }
    }, [form])
    
    return (
        <Form
            name='register-code'
            layout='vertical'
            requiredMark={false}
            form={form}
            onFinish={completeConfirmPhoneAction}
        >
            <Row>
                <Col span={FULL_SPAN_COL}>
                    <Typography.Paragraph size='medium'>
                        <FormattedMessage
                            id='components.common.registerForm.info.SMS.sent.message'
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
                    <Form.Item name='code' label={SMSCodeFieldLabel} required>
                        <Input
                            inputMode='numeric'
                            pattern='[0-9]*'
                            placeholder={CODE_PLACEHOLDER}
                            onChange={handleCodeValueChange}
                            maxLength={CONFIRM_PHONE_ACTION_CODE_LENGTH}
                            autoComplete='one-time-code'
                        />
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    {actionTTL > 0 ? (
                        <Typography.Text size='medium'>
                            <FormattedMessage
                                id='components.common.registerForm.info.SMS.alive.message'
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