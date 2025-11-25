import { GetServerSideProps } from 'next'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { FormEvent, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button, Input, Typography, Space } from '@open-condo/ui'

import { BaseLayout } from '@/domains/common/components/BaseLayout'
import { postRequest } from '@/domains/common/utils/http'
import { useLaunchParams } from '@/domains/common/utils/useLaunchParams'


import styles from './addModule.module.css'


const AddModulesPage: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const { context: { condoContextEntityId: condoOrganizationId, condoUserId } } = useLaunchParams()
    const isOrgId = !!condoOrganizationId && typeof condoOrganizationId === 'string'
    const userId = condoUserId
    const [loading, setLoading] = useState(false)
    const [formValues, setFormValues] = useState({
        serverUrl: '',
        description: '',
        username: '',
        port: '',
        password: '',
        imapHost: '',
        imapPort: '',
    })

    const handleChange = (field: keyof typeof formValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { value } = event.target
        setFormValues((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        console.log(formValues)

        if (!isOrgId || !userId) {
            return
        }

        setLoading(true)

        try {
            await postRequest('/emails/email-settings', {
                data: {
                    organization_id: condoOrganizationId,
                    user_id: userId,
                    email_login: formValues.username,
                    email_password: formValues.password,
                    description: formValues.description,
                    smtp_host: formValues.serverUrl,
                    smtp_port: Number(formValues.port),
                    imap_host: formValues.imapHost,
                    imap_port: Number(formValues.imapPort),
                },
            })

            await router.push('/channels')
        } finally {
            setLoading(false)
        }
    }

    return (
        <BaseLayout>
            <div className={styles.container}>
                <div className={styles.form}>
                    <Typography.Title level={5} className={styles.sectionTitle}>
                        {intl.formatMessage({ id: 'pages.addModule.emailCredentials' })}
                    </Typography.Title>

                    <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                            <Typography.Text>
                                {intl.formatMessage({ id: 'pages.addModule.username' })}
                            </Typography.Text>
                            <Input
                                required
                                type='email'
                                value={formValues.username}
                                onChange={handleChange('username')}
                                placeholder='user@example.com'
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <Typography.Text>
                                {intl.formatMessage({ id: 'pages.addModule.password' })}
                            </Typography.Text>
                            <Input.Password
                                required
                                value={formValues.password}
                                onChange={handleChange('password')}
                            />
                        </div>
                    </div>

                    <Typography.Title level={3}>
                        {intl.formatMessage({ id: 'pages.addModule.title' })}
                    </Typography.Title>

                    <div className={styles.fieldGroup}>
                        <Typography.Text>
                            {intl.formatMessage({ id: 'pages.addModule.description' })}
                        </Typography.Text>
                        <Input.TextArea
                            value={formValues.description}
                            onChange={handleChange('description')}
                            placeholder={intl.formatMessage({ id: 'pages.addModule.descriptionPlaceholder' })}
                            rows={3}
                        />
                    </div>

                    <Typography.Title level={5} className={styles.sectionTitle}>
                        {intl.formatMessage({ id: 'pages.addModule.smtpSettings' })}
                    </Typography.Title>

                    <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                            <Typography.Text>
                                {intl.formatMessage({ id: 'pages.addModule.serverUrl' })}
                            </Typography.Text>
                            <Input
                                required
                                value={formValues.serverUrl}
                                onChange={handleChange('serverUrl')}
                                placeholder={intl.formatMessage({ id: 'pages.addModule.serverUrlPlaceholder' })}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <Typography.Text>
                                {intl.formatMessage({ id: 'pages.addModule.port' })}
                            </Typography.Text>
                            <Input
                                required
                                type='number'
                                value={formValues.port}
                                onChange={handleChange('port')}
                                min={1}
                                max={65535}
                            />
                        </div>
                    </div>

                    <Typography.Title level={5} className={styles.sectionTitle}>
                        {intl.formatMessage({ id: 'pages.addModule.imapSettings' })}
                    </Typography.Title>

                    <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                            <Typography.Text>
                                {intl.formatMessage({ id: 'pages.addModule.imapHost' })}
                            </Typography.Text>
                            <Input
                                required
                                value={formValues.imapHost}
                                onChange={handleChange('imapHost')}
                                placeholder={intl.formatMessage({ id: 'pages.addModule.imapHostPlaceholder' })}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <Typography.Text>
                                {intl.formatMessage({ id: 'pages.addModule.imapPort' })}
                            </Typography.Text>
                            <Input
                                required
                                type='number'
                                value={formValues.imapPort}
                                onChange={handleChange('imapPort')}
                                min={1}
                                max={65535}
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Space size={8}>
                            <Button type='secondary' onClick={() => router.back()}>
                                {intl.formatMessage({ id: 'pages.addModule.cancel' })}
                            </Button>
                            <Button htmlType='submit' onClick={handleSubmit} type='primary' loading={loading}>
                                {intl.formatMessage({ id: 'pages.addModule.submit' })}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
        </BaseLayout>
    )
}

export const getServerSideProps: GetServerSideProps = async () => {
    const { publicRuntimeConfig } = getConfig()

    return { props:{ } }
}


export default AddModulesPage