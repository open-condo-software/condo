import { Form, Row, Col } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Typography, Input } from '@open-condo/ui'

import { CONFIRM_EMAIL_ACTION_CODE_LENGTH } from '@dev-portal-api/domains/user/constants'

import styles from './CodeInputStep.module.css'

import type { FormInstance } from 'antd'

const CODE_PLACEHOLDER = [...Array(CONFIRM_EMAIL_ACTION_CODE_LENGTH).keys()].map(idx => idx + 1).join('')
const FULL_SPAN_COL = 24

export type CodeInputStepProps = {
    form: FormInstance
    actionTTL: number
    actionId: string
    email: string
    onEmailChange: () => void
    onResendEmailClick: () => void
    onFinish: (values: { code: string }) => void
}

function formatCountDown (ttl: number): string {
    const seconds = `${ttl % 60}`.padStart(2, '0')
    const minutes = `${Math.floor(ttl / 60)}`.padStart(2, '0')
    return `${minutes}:${seconds}`
}

function hideEmail (email: string, minHiddenLength = 3): string {
    // 'my.custom.email@example.com -> 'm************il@example.com'
    // 123@example.com -> ***@example.com
    const parts = email.split('@')
    const partToHide = parts[0]
    const restParts = parts.slice(1)

    const shownPrefix = partToHide.length > minHiddenLength ? 1 : 0
    const shownSuffix = partToHide.length > minHiddenLength + 1 ? Math.min(2, partToHide.length - 1 - minHiddenLength) : 0
    const hiddenLength = partToHide.length - shownPrefix - shownSuffix

    const hiddenPart =
        partToHide.slice(0, shownPrefix)
        + '*'.repeat(hiddenLength)
        + partToHide.slice(partToHide.length - shownSuffix, partToHide.length)

    return [hiddenPart, ...restParts].join('@')
}

export const CodeInputStep: React.FC<CodeInputStepProps> = ({
    actionId,
    email,
    onEmailChange,
    form,
    actionTTL,
    onResendEmailClick,
    onFinish,
}) => {
    const intl = useIntl()
    const HideEmailMessage = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.actions.email.hide' })
    const ShowEmailMessage = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.actions.email.show' })
    const ChangeEmailMessage = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.actions.changeEmail' })
    const EmailCodeFieldLabel = intl.formatMessage({ id:'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.items.code.label' })
    const ResendCodeMessage = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.actions.resendCode' })

    const [isEmailHidden, setIsEmailHidden] = useState(true)

    const switchEmailVisibility = useCallback(() => {
        setIsEmailHidden(prev => !prev)
    }, [])

    const handleCodeValueChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value
        if (value.length === CONFIRM_EMAIL_ACTION_CODE_LENGTH) {
            form.submit()
        } else if (value.length > CONFIRM_EMAIL_ACTION_CODE_LENGTH) {
            value = value.substring(0, CONFIRM_EMAIL_ACTION_CODE_LENGTH)
            form.setFieldsValue([{ name: 'code', value }])
        }
    }, [form])

    const handleEmailChange = useCallback(() => {
        form.setFieldValue('code', '')
        onEmailChange()
    }, [form, onEmailChange])

    useEffect(() => {
        form.setFieldValue('code', '')
    }, [actionId, form])

    return (
        <Form
            key={actionId}
            name='register-code'
            form={form}
            layout='vertical'
            requiredMark={false}
            onFinish={onFinish}
        >
            <Row>
                <Col span={FULL_SPAN_COL}>
                    <Typography.Paragraph size='medium'>
                        <FormattedMessage
                            id='pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.info.email.sent.message'
                            values={{
                                email: isEmailHidden ? hideEmail(email) : email,
                            }}
                        />
                        &nbsp;
                        (<Typography.Link onClick={switchEmailVisibility}>{isEmailHidden ? ShowEmailMessage : HideEmailMessage}</Typography.Link>)
                    </Typography.Paragraph>
                </Col>
                <Col span={FULL_SPAN_COL} className={styles.messageSentCol}>
                    <Typography.Link onClick={handleEmailChange}>{ChangeEmailMessage}</Typography.Link>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='code' label={EmailCodeFieldLabel} required>
                        <Input
                            name='code'
                            inputMode='numeric'
                            pattern='[0-9]*'
                            onChange={handleCodeValueChange}
                            placeholder={CODE_PLACEHOLDER}
                            maxLength={CONFIRM_EMAIL_ACTION_CODE_LENGTH}
                            autoComplete='one-time-code'
                        />
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    {actionTTL > 0 ? (
                        <Typography.Text size='medium'>
                            <FormattedMessage
                                id='pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.info.email.alive.message'
                                values={{ ttl: formatCountDown(actionTTL) }}
                            />
                        </Typography.Text>
                    ) : (
                        <Typography.Link onClick={onResendEmailClick}>
                            {ResendCodeMessage}
                        </Typography.Link>
                    )}
                </Col>
            </Row>
        </Form>
    )
}