import { Form } from 'antd'
import React, { useEffect } from 'react'
import { useIntl } from 'react-intl'

import { Input } from '@open-condo/ui'

import { useSecretContext } from '@/domains/miniapp/components/OIDC/edit/SecretProvider'
import { OIDC_SECRET_LENGTH } from '@dev-api/domains/miniapp/constants/oidc'

import styles from './EditClientForm.module.css'

import { OidcClient } from '@/lib/gql'

const MASKED_PASSWORD = '*'.repeat(OIDC_SECRET_LENGTH)

type EditClientFormProps = {
    id: string
    environment: string
    client: OidcClient,
}

export const EditClientForm: React.FC<EditClientFormProps> = ({ id, environment, client }) => {
    const intl = useIntl()
    const ClientIDLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.items.clientId.label' })
    const ClientSecretLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.editClientForm.items.clientSecret.label' })

    const { secret } = useSecretContext()

    const [form] = Form.useForm()

    useEffect(() => {
        if (form) {
            form.setFieldValue('clientSecret', secret || MASKED_PASSWORD)
        }
    }, [form, secret])

    return (
        <Form
            name='edit-oidc-client'
            layout='vertical'
            form={form}
            initialValues={{
                clientId: client.clientId,
            }}
        >
            <Form.Item
                name='clientId'
                label={ClientIDLabel}
            >
                <Input readOnly/>
            </Form.Item>
            <div>
                <Form.Item
                    name='clientSecret'
                    label={ClientSecretLabel}
                    className={styles.passwordItem}
                >
                    <Input.Password
                        readOnly
                        visibilityToggle={{ visible: Boolean(secret) }}
                        disabled={!secret}
                    />
                </Form.Item>
            </div>
        </Form>
    )
}