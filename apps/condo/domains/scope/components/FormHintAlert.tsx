import { useIntl } from '@open-condo/next/intl'
import { Typography } from 'antd'
import React, { CSSProperties, useMemo } from 'react'

import { Alert } from '@condo/domains/common/components/Alert'

const ALERT_MESSAGE_STYLE: CSSProperties = { color: 'inherit', marginBottom: '4px' }

export const FormHintAlert = () => {
    const intl = useIntl()
    const AlertTitle = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.alert.message' })
    const AlertDescriptionMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.alert.description' })
    const AlertDescriptionLink = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.alert.descriptionLink' })

    const AlertMessage = useMemo(() => (
        <Typography.Paragraph strong style={ALERT_MESSAGE_STYLE}>
            {AlertTitle}
        </Typography.Paragraph>
    ), [AlertTitle])

    const AlertDescription = useMemo(() => (
        <>
            <Typography.Paragraph>
                {AlertDescriptionMessage}
            </Typography.Paragraph>
            <Typography.Link underline href='/employee' target='_blank'>
                <Typography.Text>
                    {AlertDescriptionLink}
                </Typography.Text>
            </Typography.Link>
        </>
    ), [AlertDescriptionLink, AlertDescriptionMessage])

    return (
        <Alert
            type='info'
            showIcon
            message={AlertMessage}
            description={AlertDescription}
        />
    )
}