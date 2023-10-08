import { Typography } from 'antd'
import React, { CSSProperties, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Alert } from '@open-condo/ui'

import { useTracking } from '@condo/domains/common/components/TrackingContext'

const ALERT_MESSAGE_STYLE: CSSProperties = { color: 'inherit', marginBottom: '4px' }
const EMPLOYEES_LIST_LINK_CLICK_EVENT_NAME = 'PropertyScopeUpdateToEmployeeList'

export const FormHintAlert = () => {
    const intl = useIntl()
    const AlertTitle = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.alert.message' })
    const AlertDescriptionMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.alert.description' })
    const AlertDescriptionLink = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.alert.descriptionLink' })

    const { getTrackingWrappedCallback } = useTracking()
    const handleLinkClick = useMemo(() => getTrackingWrappedCallback(EMPLOYEES_LIST_LINK_CLICK_EVENT_NAME),
        [getTrackingWrappedCallback])

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
            <Typography.Link underline href='/employee' target='_blank' onClick={handleLinkClick}>
                <Typography.Text>
                    {AlertDescriptionLink}
                </Typography.Text>
            </Typography.Link>
        </>
    ), [AlertDescriptionLink, AlertDescriptionMessage, handleLinkClick])

    return (
        <Alert
            type='info'
            showIcon
            message={AlertMessage}
            description={AlertDescription}
        />
    )
}