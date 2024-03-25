import { Col, Form, Row } from 'antd'
import React from 'react'
import { useIntl } from 'react-intl'

import { Input, Alert } from '@open-condo/ui'

import { useValidations } from '@/domains/common/hooks/useValidations'

import type { FormInstance } from 'antd'

const FULL_SPAN_COL = 24

export type EmailInputStepProps = {
    form: FormInstance
    onFinish: (values: { email: string }) => void
}

export const EmailInputStep: React.FC<EmailInputStepProps> = ({ form, onFinish }) => {
    const intl = useIntl()
    const EmailLabel = intl.formatMessage({ id: 'apps.id.sections.serviceUser.userSettings.registerUserForm.items.email.label' })
    const EmailPlaceholder = intl.formatMessage({ id: 'apps.id.sections.serviceUser.userSettings.registerUserForm.items.email.placeholder' })
    const EmailHintMessage = intl.formatMessage({ id: 'apps.id.sections.serviceUser.userSettings.registerUserForm.items.email.hint' })

    const { emailValidator, requiredFieldValidator } = useValidations()

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