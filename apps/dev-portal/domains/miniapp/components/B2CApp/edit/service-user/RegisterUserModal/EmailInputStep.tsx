import { Col, Form, Row } from 'antd'
import React from 'react'
import { useIntl } from 'react-intl'

import { Input } from '@open-condo/ui'

import { useValidations } from '@/domains/common/hooks/useValidations'

const FULL_SPAN_COL = 24

export const EmailInputStep: React.FC = () => {
    const intl = useIntl()
    const EmailLabel = intl.formatMessage({ id: 'apps.b2c.sections.serviceUser.userSettings.registerUserForm.items.email.label' })
    const EmailPlaceholder = intl.formatMessage({ id: 'apps.b2c.sections.serviceUser.userSettings.registerUserForm.items.email.placeholder' })

    const [form] = Form.useForm()
    const { emailValidator } = useValidations()

    return (
        <Form
            name='register-email'
            layout='vertical'
            requiredMark={false}
            form={form}
        >
            <Row>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='email' label={EmailLabel} rules={[emailValidator]} required>
                        <Input placeholder={EmailPlaceholder}/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}></Col>
            </Row>
        </Form>
    )
}