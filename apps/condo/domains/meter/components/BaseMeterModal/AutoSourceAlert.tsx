import { Alert, Typography } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

type IAutoSourceAlertProps = {
    sourceAppName: string
}

export const AutoSourceAlert: React.FC<IAutoSourceAlertProps> = ({ sourceAppName }) => {
    const intl = useIntl()
    const Title = intl.formatMessage({ id: 'meter.autoSourceAlert.title' })
    const Message = intl.formatMessage({ id: 'meter.autoSourceAlert.message' }, {
        app: sourceAppName,
    })
    return (
        <Alert
            type='warning'
            showIcon
            message={<Typography.Text strong>{Title}</Typography.Text>}
            description={Message}
        />
    )
}