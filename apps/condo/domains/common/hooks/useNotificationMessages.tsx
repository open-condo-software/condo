import { Typography } from 'antd'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'


export const useNotificationMessages = () => {
    const intl = useIntl()
    const ChangesSavedMessage = intl.formatMessage({ id: 'ChangesSaved' })
    const ReadyMessage = intl.formatMessage({ id: 'Ready' })

    const getSuccessfulChangeNotification = useCallback(() => ({
        message: <Typography.Text strong>{ReadyMessage}</Typography.Text>,
        description: <Typography.Text type='secondary'>{ChangesSavedMessage}</Typography.Text>,
    }), [ChangesSavedMessage, ReadyMessage])

    return { getSuccessfulChangeNotification }
}
