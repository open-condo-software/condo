import getConfig from 'next/config'
import { useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { UserMessageType, SUBSCRIPTION_EXPIRATION_CUSTOM_CLIENT_MESSAGE_TYPE } from '@condo/domains/notification/utils/client/constants'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'


const { publicRuntimeConfig: { serverUrl } } = getConfig()

/**
 * Check if stored date is from today
 */
const isStoredToday = (storedDate: string): boolean => {
    const stored = new Date(storedDate)
    const now = new Date()
    return stored.getFullYear() === now.getFullYear() &&
        stored.getMonth() === now.getMonth() &&
        stored.getDate() === now.getDate()
}
const READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY = 'readSubscriptionExpirationMessageAt'
const DAYS_BEFORE_EXPIRATION_TO_SHOW = 7

interface ReadSubscriptionExpirationMessageStorage {
    [organizationId: string]: string
}

interface SubscriptionExpirationNotification {
    message?: UserMessageType
    markAsRead?: () => void
}

export const useSubscriptionExpirationNotification = (): SubscriptionExpirationNotification => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscriptionContext, daysRemaining } = useOrganizationSubscription()

    const organizationId = organization?.id

    const storage = useMemo(() => {
        if (typeof window === 'undefined') return null
        
        return new LocalStorageManager<ReadSubscriptionExpirationMessageStorage>()
    }, [])

    const readSubscriptionExpirationMessageAt = useMemo(() => {
        const storedData = storage?.getItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY)?.[organizationId]
        if (!storedData) return undefined
        
        return isStoredToday(storedData) ? storedData : undefined
    }, [storage, organizationId])

    const createdAt = useMemo(() => readSubscriptionExpirationMessageAt || new Date().toISOString(), [readSubscriptionExpirationMessageAt])

    const markAsRead = useCallback(() => {
        if (!readSubscriptionExpirationMessageAt && organizationId) {
            const oldValue = storage?.getItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY) || {}
            storage?.setItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY, { ...oldValue, [organizationId]: createdAt })
        }
    }, [createdAt, readSubscriptionExpirationMessageAt, storage, organizationId])

    const hasPaymentMethod = Boolean(subscriptionContext?.meta?.paymentMethod)

    const messageContent = useMemo(() => {
        if (daysRemaining === null || daysRemaining > DAYS_BEFORE_EXPIRATION_TO_SHOW || daysRemaining < 0) {
            return null
        }

        if (hasPaymentMethod) {
            return null
        }

        const isTrial = subscriptionContext?.isTrial
        const planName = subscriptionContext?.subscriptionPlan?.name || ''

        if (isTrial) {
            if (daysRemaining <= 1) {
                return {
                    title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial.lastDay.title' }),
                    content: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial.lastDay.content' }),
                }
            }
            return {
                title: intl.formatMessage(
                    { id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial.title' },
                    { days: daysRemaining }
                ),
                content: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial.content' }),
            }
        }

        if (daysRemaining <= 1) {
            return {
                title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid.lastDay.title' }),
                content: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid.lastDay.content' }),
            }
        }
        return {
            title: intl.formatMessage(
                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid.title' },
                { days: daysRemaining }
            ),
            content: intl.formatMessage(
                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid.content' },
                { planName }
            ),
        }
    }, [hasPaymentMethod, daysRemaining, subscriptionContext?.isTrial, subscriptionContext?.subscriptionPlan?.name, intl])

    if (!organizationId || !subscriptionContext || !messageContent) {
        return {}
    }

    return {
        message: {
            id: `subscription-expiration-${organizationId}`,
            type: SUBSCRIPTION_EXPIRATION_CUSTOM_CLIENT_MESSAGE_TYPE,
            createdAt,
            meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
            defaultContent: { content: messageContent.content },
            customTitle: messageContent.title,
        } as UserMessageType,
        markAsRead,
    }
}
