import { Form } from 'antd'
import React from 'react'
import { useIntl } from 'react-intl'

import { Button, Checkbox } from '@open-condo/ui'

import styles from './PublishForm.module.css'

export const PublishForm: React.FC<{ isPublishing: boolean }> = ({ isPublishing }) => {
    const intl = useIntl()
    const ChooseComponentsLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.components.label' })
    const InfoLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.info.label' })
    const PublishButtonLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.actions.publish' })

    return (
        <>
            <Form.Item name='info' valuePropName='checked' label={ChooseComponentsLabel} className={styles.checkboxItem}>
                <Checkbox label={InfoLabel}/>
            </Form.Item>
            <Button
                type='primary'
                htmlType='submit'
                className={styles.submitButton}
                loading={isPublishing}
                disabled={isPublishing}
            >
                {PublishButtonLabel}
            </Button>
        </>
    )
}