import { notification } from 'antd'
import { useCallback } from 'react'
import { useIntl } from 'react-intl'

type OnCompletedType = () => void

export function useMutationCompletedHandler (): OnCompletedType {
    const intl = useIntl()
    const SuccessMessageTitle = intl.formatMessage({ id: 'pages.apps.any.id.notifications.successSave.title' })
    return useCallback(() => {
        notification.success({ message: SuccessMessageTitle })
    }, [SuccessMessageTitle])
}