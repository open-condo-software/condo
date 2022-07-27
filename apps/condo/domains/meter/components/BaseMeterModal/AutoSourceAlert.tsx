import React from 'react'
import { Alert, Typography } from 'antd'
import { useIntl } from '@core/next/intl'

type IAutoSourceAlertProps = {
    sourceAppName: string
}

export const AutoSourceAlert: React.FC<IAutoSourceAlertProps> = ({ sourceAppName }) => {
    const intl = useIntl()
    const Title = intl.formatMessage({ id: 'pages.condo.meter.AutoSourceAlert.title' })
    const Message = intl.formatMessage({ id: 'pages.condo.meter.AutoSourceAlert.message' }, {
        app: sourceAppName,
    })
    return (
        <Alert
            type={'warning'}
            showIcon
            message={<Typography.Text strong>{Title}</Typography.Text> }
            description={Message}
        />
    )
}