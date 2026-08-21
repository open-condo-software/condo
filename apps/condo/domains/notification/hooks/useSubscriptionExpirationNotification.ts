import { useGetOrganizationActiveFeatureSubscriptionContextsQuery } from '@app/condo/gql'
import dayjs from 'dayjs'
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
    [contextId: string]: string
}

interface SubscriptionExpirationNotifications {
    messages: UserMessageType[]
    markAllAsRead?: () => void
}

interface ExpirationMessageContent {
    title: string
    content: string
}

function buildExpirationMessageContent (
    intl: ReturnType<typeof useIntl>,
    { isTrial, daysRemaining, planName }: { isTrial: boolean, daysRemaining: number, planName: string }
): ExpirationMessageContent | null {
    if (daysRemaining > DAYS_BEFORE_EXPIRATION_TO_SHOW || daysRemaining < 0) {
        return null
    }

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
}

export const useSubscriptionExpirationNotification = (): SubscriptionExpirationNotifications => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscriptionContext, activeSubscriptionEndAtWithoutBuffer, hasSubscriptionsFeature } = useOrganizationSubscription()

    const organizationId = organization?.id

    const { data: featureContextsData } = useGetOrganizationActiveFeatureSubscriptionContextsQuery({
        variables: {
            organizationId: organizationId || '',
        },
        skip: !organizationId || !hasSubscriptionsFeature,
    })
    const featureSubscriptionContexts = useMemo(() => featureContextsData?.featureSubscriptionContexts || [], [featureContextsData?.featureSubscriptionContexts])

    const storage = useMemo(() => {
        if (typeof window === 'undefined') return null

        return new LocalStorageManager<ReadSubscriptionExpirationMessageStorage>()
    }, [])

    const getReadMessageAt = useCallback((contextId: string): string | undefined => {
        const storedData = storage?.getItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY)?.[contextId]
        if (!storedData) return undefined

        return isStoredToday(storedData) ? storedData : undefined
    }, [storage])

    const { messages, contextIds } = useMemo(() => {
        const msgs: UserMessageType[] = []
        const ids: string[] = []

        if (!organizationId) {
            return { messages: msgs, contextIds: ids }
        }

        const pushMessage = (contextId: string, isTrial: boolean, endAt: string, planName: string, hasPaymentMethod: boolean) => {
            if (hasPaymentMethod) return

            const daysRemaining = Math.ceil(dayjs(endAt).diff(dayjs(), 'day', true))
            const messageContent = buildExpirationMessageContent(intl, { isTrial, daysRemaining, planName })
            if (!messageContent) return

            const readAt = getReadMessageAt(contextId)
            const createdAt = readAt || new Date().toISOString()

            msgs.push({
                id: `subscription-expiration-${contextId}`,
                type: SUBSCRIPTION_EXPIRATION_CUSTOM_CLIENT_MESSAGE_TYPE,
                createdAt,
                meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                defaultContent: { content: messageContent.content },
                customTitle: messageContent.title,
            } as UserMessageType)
            ids.push(contextId)
        }

        if (subscriptionContext && activeSubscriptionEndAtWithoutBuffer) {
            pushMessage(
                subscriptionContext.id,
                Boolean(subscriptionContext.isTrial),
                activeSubscriptionEndAtWithoutBuffer.toISOString(),
                subscriptionContext.subscriptionPlan?.name || '',
                Boolean(subscriptionContext.bindingId)
            )
        }

        for (const featureContext of featureSubscriptionContexts) {
            if (!featureContext?.id || !featureContext?.endAt) continue

            pushMessage(
                featureContext.id,
                Boolean(featureContext.isTrial),
                featureContext.endAt,
                featureContext.subscriptionPlan?.name || '',
                Boolean(featureContext.bindingId)
            )
        }

        return { messages: msgs, contextIds: ids }
    }, [organizationId, subscriptionContext, activeSubscriptionEndAtWithoutBuffer, featureSubscriptionContexts, intl, getReadMessageAt])

    const markAllAsRead = useCallback(() => {
        if (!storage || contextIds.length === 0) return

        const oldValue = storage.getItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY) || {}
        const newValue = { ...oldValue }
        let changed = false

        contextIds.forEach((contextId, index) => {
            if (!newValue[contextId]) {
                newValue[contextId] = messages[index].createdAt
                changed = true
            }
        })

        if (changed) {
            storage.setItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY, newValue)
        }
    }, [storage, contextIds, messages])

    return {
        messages,
        markAllAsRead,
    }
}
