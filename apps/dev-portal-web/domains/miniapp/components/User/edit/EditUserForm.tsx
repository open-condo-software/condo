import { Form, Divider } from 'antd'
import React, { CSSProperties } from 'react'
import { useIntl } from 'react-intl'

import { Typography, Input } from '@open-condo/ui'

import { AppEnvironment } from '@/gql'

type EditUserFormProps = {
    id: string
    environment: AppEnvironment
    email?: string | null
}

const CREDENTIALS_DIVIDER_STYLES: CSSProperties = { marginBottom: 24 }

export const EditUserForm: React.FC<EditUserFormProps> = ({ email, environment, id }) => {
    const intl = useIntl()
    const CredentialsLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.editUserForm.subsection.credentials.label' })
    const EmailFieldLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.editUserForm.items.email.label' })

    return (
        <Form
            // NOTE: Rerender form (initial values) on environment change
            key={`${id}:${environment}`}
            name='edit-service-user'
            layout='vertical'
            requiredMark={false}
            initialValues={{ email }}
        >
            <Divider orientation='left' orientationMargin={0} style={CREDENTIALS_DIVIDER_STYLES}>
                <Typography.Title level={4}>
                    {CredentialsLabel}
                </Typography.Title>
            </Divider>
            <Form.Item
                name='email'
                label={EmailFieldLabel}
            >
                <Input readOnly/>
            </Form.Item>
        </Form>
    )
}