import getConfig from 'next/config'
import { useMemo, useCallback } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { UserMessageType, EMAIL_CONFIRMATION_CUSTOM_CLIENT_MESSAGE_TYPE } from '@condo/domains/notification/utils/client/constants'


const { publicRuntimeConfig: { serverUrl } } = getConfig()

const STORAGE_KEY_TTL_IN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const READ_EMAIL_CONFIRMATION_MESSAGE_AT_KEY = 'readEmailConfirmationMessageAt'

interface ReadEmailConfirmationMessageStorage {
    [userId: string]: string
}

interface EmailConfirmationNotification {
    message?: UserMessageType
    markAsRead?: () => void
}

export const useEmailConfirmationNotification = (): EmailConfirmationNotification => {
    const intl = useIntl()
    const ContentMessage = intl.formatMessage({ id: 'notification.UserMessagesList.message.EMAIL_CONFIRMATION_CUSTOM_CLIENT_MESSAGE.content' })
    
    const { user } = useAuth()
    const userEmail = useMemo(() => user?.email, [user?.email])
    const isEmailVerified = useMemo(() => user?.isEmailVerified, [user?.isEmailVerified])
    
    const storage = useMemo(() => {
        if (typeof window === 'undefined') return null
        
        return new LocalStorageManager<ReadEmailConfirmationMessageStorage>()
    }, [])

    const readEmailConfirmationMessageAt = useMemo(() => {
        const value = storage?.getItem(READ_EMAIL_CONFIRMATION_MESSAGE_AT_KEY)?.[user?.id]
        return value && new Date(value).getTime() + STORAGE_KEY_TTL_IN_MS < Date.now() ? undefined : value
    }, [storage, user?.id])
    const createdAt = useMemo(() => readEmailConfirmationMessageAt || new Date().toISOString(), [readEmailConfirmationMessageAt])

    const markAsRead = useCallback(() => {
        if (!readEmailConfirmationMessageAt) {
            const oldValue = storage?.getItem(READ_EMAIL_CONFIRMATION_MESSAGE_AT_KEY) || {}
            storage?.setItem(READ_EMAIL_CONFIRMATION_MESSAGE_AT_KEY, { ...oldValue, [user?.id]: createdAt })
        }
    }, [createdAt, readEmailConfirmationMessageAt, storage, user?.id])

    if (!userEmail || isEmailVerified) {
        return {}
    }

    return {
        message: {
            id: 'email-confirmation',
            type: EMAIL_CONFIRMATION_CUSTOM_CLIENT_MESSAGE_TYPE,
            createdAt,
            meta: { data: { url: `${serverUrl}/user?tab=INFO` } },
            defaultContent: { content: ContentMessage },
        },
        markAsRead,
    }
}
