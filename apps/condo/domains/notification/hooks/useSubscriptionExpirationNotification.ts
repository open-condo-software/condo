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
    [messageId: string]: string
}

interface SubscriptionExpirationNotifications {
    messages: UserMessageType[]
    markAllAsRead?: () => void
}

interface ExpirationMessageContent {
    title: string
    content: string
}

/** The plan or a feature bought on top of it, whichever is expiring */
interface ExpiringEntry {
    id: string
    isTrial: boolean
    endAt: string
    hasPaymentMethod: boolean
    planName: string
}

/** Designs spell every feature out as its own quoted name: «Маркетплейс», «Электронные квитанции» */
const featureNamesOf = (entries: ReadonlyArray<ExpiringEntry>): string =>
    entries.map(entry => `«${entry.planName}»`).join(', ')

/** A features-only group needs its own wording, since "до конца пробного периода" implies the plan */
function buildExpirationMessageContent (
    intl: ReturnType<typeof useIntl>,
    { isTrial, daysRemaining, planName, features }: { isTrial: boolean, daysRemaining: number, planName: string, features: string | null }
): ExpirationMessageContent | null {
    if (daysRemaining > DAYS_BEFORE_EXPIRATION_TO_SHOW || daysRemaining < 0) {
        return null
    }

    const scope = features ? '.features' : ''

    if (isTrial) {
        if (daysRemaining <= 1) {
            return {
                title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial.lastDay.title' }),
                content: features
                    ? intl.formatMessage({ id: `notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial${scope}.lastDay.content` as FormatjsIntl.Message['ids'] }, { features })
                    : intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial.lastDay.content' }),
            }
        }
        return {
            title: intl.formatMessage(
                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial.title' },
                { days: daysRemaining }
            ),
            content: features
                ? intl.formatMessage({ id: `notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial${scope}.content` as FormatjsIntl.Message['ids'] }, { features })
                : intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.trial.content' }),
        }
    }

    if (daysRemaining <= 1) {
        return {
            title: intl.formatMessage({ id: `notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid${scope}.lastDay.title` as FormatjsIntl.Message['ids'] }),
            content: features
                ? intl.formatMessage({ id: `notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid${scope}.lastDay.content` as FormatjsIntl.Message['ids'] }, { features })
                : intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid.lastDay.content' }),
        }
    }
    return {
        title: intl.formatMessage(
            { id: `notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid${scope}.title` as FormatjsIntl.Message['ids'] },
            { days: daysRemaining }
        ),
        content: features
            ? intl.formatMessage({ id: `notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid${scope}.content` as FormatjsIntl.Message['ids'] }, { features })
            : intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_EXPIRATION.paid.content' }, { planName }),
    }
}

const dateKeyOf = (endAt: string): string => dayjs(endAt).format('YYYY-MM-DD')

const groupIdOf = (entries: ReadonlyArray<ExpiringEntry>): string =>
    entries.map(entry => entry.id).sort((left, right) => left.localeCompare(right)).join('_')

/** Groups by end date and trial-ness, so everything expiring together becomes one message */
function groupExpiringEntries (entries: ReadonlyArray<ExpiringEntry>): ReadonlyArray<ExpiringEntry[]> {
    const groups = new Map<string, ExpiringEntry[]>()

    for (const entry of entries) {
        if (entry.hasPaymentMethod) continue

        const key = `${dateKeyOf(entry.endAt)}:${entry.isTrial}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(entry)
    }

    return [...groups.values()]
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

    const getReadMessageAt = useCallback((messageId: string): string | undefined => {
        const storedData = storage?.getItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY)?.[messageId]
        if (!storedData) return undefined

        return isStoredToday(storedData) ? storedData : undefined
    }, [storage])

    const { messages, messageIds } = useMemo(() => {
        const msgs: UserMessageType[] = []
        const ids: string[] = []

        if (!organizationId) {
            return { messages: msgs, messageIds: ids }
        }

        const entries: ExpiringEntry[] = []

        if (subscriptionContext && activeSubscriptionEndAtWithoutBuffer) {
            entries.push({
                id: subscriptionContext.id,
                isTrial: Boolean(subscriptionContext.isTrial),
                endAt: activeSubscriptionEndAtWithoutBuffer.toISOString(),
                hasPaymentMethod: Boolean(subscriptionContext.bindingId),
                planName: subscriptionContext.subscriptionPlan?.name || '',
            })
        }

        for (const featureContext of featureSubscriptionContexts) {
            if (!featureContext?.id || !featureContext?.endAt) continue

            entries.push({
                id: featureContext.id,
                isTrial: Boolean(featureContext.isTrial),
                endAt: featureContext.endAt,
                hasPaymentMethod: Boolean(featureContext.bindingId),
                planName: featureContext.subscriptionPlan?.name || '',
            })
        }

        const now = dayjs()

        for (const group of groupExpiringEntries(entries)) {
            const planEntry = group.find(entry => entry.id === subscriptionContext?.id)
            const daysRemaining = dayjs(group[0].endAt).startOf('day').diff(now.startOf('day'), 'day')

            const messageContent = buildExpirationMessageContent(intl, {
                isTrial: group[0].isTrial,
                daysRemaining,
                planName: planEntry?.planName ?? '',
                features: planEntry ? null : featureNamesOf(group),
            })
            if (!messageContent) continue

            const messageId = `subscription-expiration-${groupIdOf(group)}`
            const readAt = getReadMessageAt(messageId)
            const createdAt = readAt || new Date().toISOString()

            msgs.push({
                id: messageId,
                type: SUBSCRIPTION_EXPIRATION_CUSTOM_CLIENT_MESSAGE_TYPE,
                createdAt,
                meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                defaultContent: { content: messageContent.content },
                customTitle: messageContent.title,
            } as UserMessageType)
            ids.push(messageId)
        }

        return { messages: msgs, messageIds: ids }
    }, [organizationId, subscriptionContext, activeSubscriptionEndAtWithoutBuffer, featureSubscriptionContexts, intl, getReadMessageAt])

    const markAllAsRead = useCallback(() => {
        if (!storage || messageIds.length === 0) return

        const oldValue = storage.getItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY) || {}
        const newValue = { ...oldValue }
        let changed = false

        messageIds.forEach((messageId, index) => {
            if (!newValue[messageId]) {
                newValue[messageId] = messages[index].createdAt
                changed = true
            }
        })

        if (changed) {
            storage.setItem(READ_SUBSCRIPTION_EXPIRATION_MESSAGE_AT_KEY, newValue)
        }
    }, [storage, messageIds, messages])

    return {
        messages,
        markAllAsRead,
    }
}
