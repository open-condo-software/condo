import { Typography } from 'antd'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'


export const useNotificationMessages = () => {
    const intl = useIntl()
    const ChangesSavedMessage = intl.formatMessage({ id: 'changesSaved' })
    const ReadyMessage = intl.formatMessage({ id: 'ready' })

    const getSuccessfulChangeNotification = useCallback(() => ({
        message: <Typography.Text strong>{ReadyMessage}</Typography.Text>,
        description: <Typography.Text type='secondary'>{ChangesSavedMessage}</Typography.Text>,
    }), [ChangesSavedMessage, ReadyMessage])

    return { getSuccessfulChangeNotification }
}
