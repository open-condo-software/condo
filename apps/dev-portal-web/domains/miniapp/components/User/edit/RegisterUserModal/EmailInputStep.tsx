import { Col, Form, Row } from 'antd'
import React, { useEffect } from 'react'
import { useIntl } from 'react-intl'

import { Input, Alert } from '@open-condo/ui'

import { useValidations } from '@/domains/common/hooks/useValidations'

import type { FormInstance } from 'antd'

const FULL_SPAN_COL = 24

export type EmailInputStepProps = {
    form: FormInstance
    onFinish: (values: { email: string }) => void
    errorMsg?: string | null
}

export const EmailInputStep: React.FC<EmailInputStepProps> = ({ form, onFinish, errorMsg }) => {
    const intl = useIntl()
    const EmailLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.items.email.label' })
    const EmailPlaceholder = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.items.email.placeholder' })
    const EmailHintMessage = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.items.email.hint' })

    const { emailValidator, requiredFieldValidator } = useValidations()

    useEffect(() => {
        if (errorMsg && form) {
            form.setFields([{ name: 'email', errors: [errorMsg] }])
        }
    }, [form, errorMsg])

    return (
        <Form
            name='register-email'
            layout='vertical'
            requiredMark={false}
            form={form}
            onFinish={onFinish}
        >
            <Row>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='email' label={EmailLabel} rules={[requiredFieldValidator, emailValidator]} required>
                        <Input placeholder={EmailPlaceholder} name='email' inputMode='email'/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    <Alert
                        type='warning'
                        showIcon
                        description={EmailHintMessage}
                    />
                </Col>
            </Row>
        </Form>
    )
}