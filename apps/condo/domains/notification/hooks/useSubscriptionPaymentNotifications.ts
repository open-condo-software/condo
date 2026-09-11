import { useGetOrganizationSubscriptionContextsWithPaymentMethodsQuery } from '@app/condo/gql'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import { useMemo, useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import {
    UserMessageType,
    SUBSCRIPTION_PAYMENT_REMINDER_CUSTOM_CLIENT_MESSAGE_TYPE,
    SUBSCRIPTION_PAYMENT_SUCCESS_CUSTOM_CLIENT_MESSAGE_TYPE,
    SUBSCRIPTION_PAYMENT_ERROR_CUSTOM_CLIENT_MESSAGE_TYPE,
} from '@condo/domains/notification/utils/client/constants'
import { SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_PLAN_TYPE_FEATURE } from '@condo/domains/subscription/constants'


const { publicRuntimeConfig: { serverUrl } } = getConfig()

const isStoredToday = (storedDate: string): boolean => {
    return dayjs(storedDate).isSame(dayjs(), 'day')
}

function isForeverSubscription (endAt: string): boolean {
    const endDate = dayjs(endAt)
    return endDate.diff(dayjs(), 'year') >= 10
}

const READ_PAYMENT_REMINDER_MESSAGE_AT_KEY = 'readPaymentReminderMessageAt'
const READ_PAYMENT_SUCCESS_MESSAGE_AT_KEY = 'readPaymentSuccessMessageAt'
const READ_PAYMENT_ERROR_MESSAGE_AT_KEY = 'readPaymentErrorMessageAt'

interface ReadMessageStorage {
    [contextId: string]: string
}

interface SubscriptionPaymentNotifications {
    messages: UserMessageType[]
    markReminderAsRead?: () => void
    markSuccessAsRead?: () => void
    markErrorAsRead?: () => void
}

export const useSubscriptionPaymentNotifications = (): SubscriptionPaymentNotifications => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const organizationId = organization?.id

    const { data: contextsData } = useGetOrganizationSubscriptionContextsWithPaymentMethodsQuery({
        variables: {
            organizationId: organizationId || '',
        },
        skip: !organizationId,
    })

    const subscriptionContexts = useMemo(() => contextsData?.subscriptionContexts || [], [contextsData?.subscriptionContexts])

    const storage = useMemo(() => {
        if (typeof window === 'undefined') return null
        return new LocalStorageManager<ReadMessageStorage>()
    }, [])

    const [currentReminderContextId, setCurrentReminderContextId] = useState<string | null>(null)
    const [currentSuccessContextId, setCurrentSuccessContextId] = useState<string | null>(null)
    const [currentErrorContextId, setCurrentErrorContextId] = useState<string | null>(null)

    const readReminderAt = useMemo(() => {
        if (!currentReminderContextId) return undefined
        return storage?.getItem(READ_PAYMENT_REMINDER_MESSAGE_AT_KEY)?.[currentReminderContextId]
    }, [storage, currentReminderContextId])

    const readSuccessAt = useMemo(() => {
        if (!currentSuccessContextId) return undefined
        return storage?.getItem(READ_PAYMENT_SUCCESS_MESSAGE_AT_KEY)?.[currentSuccessContextId]
    }, [storage, currentSuccessContextId])

    const readErrorAt = useMemo(() => {
        if (!currentErrorContextId) return undefined
        const storedData = storage?.getItem(READ_PAYMENT_ERROR_MESSAGE_AT_KEY)?.[currentErrorContextId]
        if (!storedData) return undefined
        return isStoredToday(storedData) ? storedData : undefined
    }, [storage, currentErrorContextId])

    const reminderCreatedAt = useMemo(() => readReminderAt || new Date().toISOString(), [readReminderAt])
    const successCreatedAt = useMemo(() => readSuccessAt || new Date().toISOString(), [readSuccessAt])
    const errorCreatedAt = useMemo(() => readErrorAt || new Date().toISOString(), [readErrorAt])

    const markReminderAsRead = useCallback(() => {
        if (!readReminderAt && currentReminderContextId) {
            const oldValue = storage?.getItem(READ_PAYMENT_REMINDER_MESSAGE_AT_KEY) || {}
            storage?.setItem(READ_PAYMENT_REMINDER_MESSAGE_AT_KEY, { ...oldValue, [currentReminderContextId]: reminderCreatedAt })
        }
    }, [reminderCreatedAt, readReminderAt, storage, currentReminderContextId])

    const markSuccessAsRead = useCallback(() => {
        if (!readSuccessAt && currentSuccessContextId) {
            const oldValue = storage?.getItem(READ_PAYMENT_SUCCESS_MESSAGE_AT_KEY) || {}
            storage?.setItem(READ_PAYMENT_SUCCESS_MESSAGE_AT_KEY, { ...oldValue, [currentSuccessContextId]: successCreatedAt })
        }
    }, [successCreatedAt, readSuccessAt, storage, currentSuccessContextId])

    const markErrorAsRead = useCallback(() => {
        if (!readErrorAt && currentErrorContextId) {
            const oldValue = storage?.getItem(READ_PAYMENT_ERROR_MESSAGE_AT_KEY) || {}
            storage?.setItem(READ_PAYMENT_ERROR_MESSAGE_AT_KEY, { ...oldValue, [currentErrorContextId]: errorCreatedAt })
        }
    }, [errorCreatedAt, readErrorAt, storage, currentErrorContextId])

    const messages = useMemo(() => {
        if (!organizationId || subscriptionContexts.length === 0) {
            return []
        }

        const now = dayjs()
        const msgs: UserMessageType[] = []

        /**
         * Feature plans are bought alongside a plan, so one notification per feature would bury
         * the user under near-identical cards. They are collected here and announced as a single
         * "additional functionality (a, b)" message per date instead.
         */
        const serviceContexts = subscriptionContexts.filter(context => context?.subscriptionPlan?.planType !== SUBSCRIPTION_PLAN_TYPE_FEATURE)
        const featureContexts = subscriptionContexts.filter(context => context?.subscriptionPlan?.planType === SUBSCRIPTION_PLAN_TYPE_FEATURE)

        // Which plan notifications already went out, and for which "paid until" date. Features
        // falling on the same date are covered by the plan's own wording and stay silent.
        const announcedByPlan = new Set<string>()
        const announcementKey = (kind: string, endAt: string) => `${kind}:${dayjs(endAt).format('YYYY-MM-DD')}`

        for (const context of serviceContexts) {
            const { id: contextId, endAt, status, subscriptionPlan, subscriptionPlanPricingRule, createdAt, bindingId } = context
            const planName = subscriptionPlan?.name || ''
            const price = subscriptionPlanPricingRule?.price || ''
            const currencyCode = subscriptionPlanPricingRule?.currencyCode || ''

            if (!endAt || !planName || !contextId) continue

            const endDate = dayjs(endAt)
            const contextCreatedAt = dayjs(createdAt)

            if (status === SUBSCRIPTION_CONTEXT_STATUS.DONE) {
                const dayUntilEnd = endDate.startOf('day').diff(now.startOf('day'), 'day')
                const daysSinceStarted = now.diff(dayjs(context.startAt), 'day')
                const isNotForever = !isForeverSubscription(endAt)
                
                if (bindingId && daysSinceStarted <= SUBSCRIPTION_PAYMENT_BUFFER_DAYS && isNotForever) {
                    setCurrentSuccessContextId(contextId)
                    announcedByPlan.add(announcementKey('success', endAt))
                    const formattedEndDate = endDate.format('DD.MM.YY')
                    msgs.push({
                        id: `subscription-payment-success-${contextId}`,
                        type: SUBSCRIPTION_PAYMENT_SUCCESS_CUSTOM_CLIENT_MESSAGE_TYPE,
                        createdAt: contextCreatedAt.toISOString(),
                        meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                        defaultContent: {
                            content: intl.formatMessage(
                                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_SUCCESS.content' },
                                { planName, date: formattedEndDate }
                            ),
                        },
                        customTitle: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_SUCCESS.title' }),
                    } as UserMessageType)
                }
                
                if (dayUntilEnd === 1 && price && currencyCode) {
                    setCurrentReminderContextId(contextId)
                    announcedByPlan.add(announcementKey('reminder', endAt))
                    const formattedPrice = intl.formatNumber(parseFloat(price), { 
                        style: 'currency', 
                        currency: currencyCode,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    })
                    msgs.push({
                        id: `subscription-payment-reminder-${contextId}`,
                        type: SUBSCRIPTION_PAYMENT_REMINDER_CUSTOM_CLIENT_MESSAGE_TYPE,
                        createdAt: reminderCreatedAt,
                        meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                        defaultContent: {
                            content: intl.formatMessage(
                                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_REMINDER.content' },
                                { planName, price: formattedPrice }
                            ),
                        },
                        customTitle: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_REMINDER.title' }),
                    } as UserMessageType)
                }
            }

            if (status === SUBSCRIPTION_CONTEXT_STATUS.ERROR || status === SUBSCRIPTION_CONTEXT_STATUS.PENDING) {
                const daysSinceStarted = now.diff(dayjs(context.startAt), 'day')
                
                if (daysSinceStarted >= 0 && daysSinceStarted <= SUBSCRIPTION_PAYMENT_BUFFER_DAYS) {
                    setCurrentErrorContextId(contextId)
                    announcedByPlan.add(announcementKey('error', endAt))
                    msgs.push({
                        id: `subscription-payment-error-${contextId}`,
                        type: SUBSCRIPTION_PAYMENT_ERROR_CUSTOM_CLIENT_MESSAGE_TYPE,
                        createdAt: errorCreatedAt,
                        meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                        defaultContent: {
                            content: intl.formatMessage(
                                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_ERROR.content' },
                                { planName }
                            ),
                        },
                        customTitle: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_ERROR.title' }),
                    } as UserMessageType)
                }
            }
        }

        const currentPlanName = serviceContexts.find(context => context?.subscriptionPlan?.name)?.subscriptionPlan?.name || ''

        /** Collects the features that qualify for one kind of notification, keyed by their end date */
        const groupFeatures = (kind: string, isEligible: (context: typeof featureContexts[number]) => boolean) => {
            const groups = new Map<string, typeof featureContexts>()

            for (const context of featureContexts) {
                if (!context?.endAt || !context?.id || !context?.subscriptionPlan?.name) continue
                if (!isEligible(context)) continue

                const key = announcementKey(kind, context.endAt)
                if (announcedByPlan.has(key)) continue

                if (!groups.has(key)) groups.set(key, [])
                groups.get(key).push(context)
            }

            return groups
        }

        const featureNamesOf = (contexts: typeof featureContexts) => contexts
            .map(context => context.subscriptionPlan.name.toLowerCase())
            .join(', ')

        // a group is identified by the features in it, so the read marker survives a re-render
        const groupIdOf = (contexts: typeof featureContexts) => contexts.map(context => context.id).sort().join('_')

        for (const [, contexts] of groupFeatures('success', context => {
            if (context.status !== SUBSCRIPTION_CONTEXT_STATUS.DONE) return false
            if (!context.bindingId || isForeverSubscription(context.endAt)) return false

            return now.diff(dayjs(context.startAt), 'day') <= SUBSCRIPTION_PAYMENT_BUFFER_DAYS
        })) {
            const groupId = groupIdOf(contexts)
            setCurrentSuccessContextId(groupId)
            msgs.push({
                id: `subscription-feature-payment-success-${groupId}`,
                type: SUBSCRIPTION_PAYMENT_SUCCESS_CUSTOM_CLIENT_MESSAGE_TYPE,
                createdAt: dayjs(contexts[0].createdAt).toISOString(),
                meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                defaultContent: {
                    content: intl.formatMessage(
                        { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_SUCCESS.features.content' },
                        { features: featureNamesOf(contexts), date: dayjs(contexts[0].endAt).format('DD.MM.YY') }
                    ),
                },
                customTitle: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_SUCCESS.title' }),
            } as UserMessageType)
        }

        for (const [, contexts] of groupFeatures('reminder', context => {
            if (context.status !== SUBSCRIPTION_CONTEXT_STATUS.DONE) return false
            if (!context.subscriptionPlanPricingRule?.price || !context.subscriptionPlanPricingRule?.currencyCode) return false

            return dayjs(context.endAt).startOf('day').diff(now.startOf('day'), 'day') === 1
        })) {
            const groupId = groupIdOf(contexts)
            setCurrentReminderContextId(groupId)
            const totalPrice = contexts.reduce((sum, context) => sum + parseFloat(context.subscriptionPlanPricingRule.price), 0)
            msgs.push({
                id: `subscription-feature-payment-reminder-${groupId}`,
                type: SUBSCRIPTION_PAYMENT_REMINDER_CUSTOM_CLIENT_MESSAGE_TYPE,
                createdAt: reminderCreatedAt,
                meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                defaultContent: {
                    content: intl.formatMessage(
                        { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_REMINDER.features.content' },
                        {
                            features: featureNamesOf(contexts),
                            planName: currentPlanName,
                            price: intl.formatNumber(totalPrice, {
                                style: 'currency',
                                currency: contexts[0].subscriptionPlanPricingRule.currencyCode,
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }),
                        }
                    ),
                },
                customTitle: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_REMINDER.title' }),
            } as UserMessageType)
        }

        for (const [, contexts] of groupFeatures('error', context => {
            if (context.status !== SUBSCRIPTION_CONTEXT_STATUS.ERROR && context.status !== SUBSCRIPTION_CONTEXT_STATUS.PENDING) return false
            const daysSinceStarted = now.diff(dayjs(context.startAt), 'day')

            return daysSinceStarted >= 0 && daysSinceStarted <= SUBSCRIPTION_PAYMENT_BUFFER_DAYS
        })) {
            const groupId = groupIdOf(contexts)
            setCurrentErrorContextId(groupId)
            msgs.push({
                id: `subscription-feature-payment-error-${groupId}`,
                type: SUBSCRIPTION_PAYMENT_ERROR_CUSTOM_CLIENT_MESSAGE_TYPE,
                createdAt: errorCreatedAt,
                meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                defaultContent: {
                    content: intl.formatMessage(
                        { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_ERROR.features.content' },
                        { features: featureNamesOf(contexts), planName: currentPlanName }
                    ),
                },
                customTitle: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_ERROR.title' }),
            } as UserMessageType)
        }

        return msgs
    }, [organizationId, subscriptionContexts, intl, reminderCreatedAt, errorCreatedAt])

    return {
        messages,
        markReminderAsRead,
        markSuccessAsRead,
        markErrorAsRead,
    }
}
