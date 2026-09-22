import { useGetOrganizationSubscriptionContextsWithPaymentMethodsQuery, useGetOrganizationUnpaidSubscriptionsQuery } from '@app/condo/gql'
import dayjs, { Dayjs } from 'dayjs'
import getConfig from 'next/config'
import { useCallback, useMemo, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import {
    UserMessageType,
    SUBSCRIPTION_PAYMENT_REMINDER_CUSTOM_CLIENT_MESSAGE_TYPE,
    SUBSCRIPTION_PAYMENT_SUCCESS_CUSTOM_CLIENT_MESSAGE_TYPE,
    SUBSCRIPTION_PAYMENT_ERROR_CUSTOM_CLIENT_MESSAGE_TYPE,
} from '@condo/domains/notification/utils/client/constants'
import {
    SUBSCRIPTION_CONTEXT_STATUS,
    SUBSCRIPTION_PAYMENT_BUFFER_DAYS,
    SUBSCRIPTION_PAYMENT_TYPE_CARD,
    SUBSCRIPTION_PLAN_TYPE_FEATURE,
} from '@condo/domains/subscription/constants'

import type { IntlShape } from 'react-intl'


const { publicRuntimeConfig: { serverUrl } } = getConfig()

const isStoredToday = (storedDate: string): boolean => dayjs(storedDate).isSame(dayjs(), 'day')

function formatPaidUntil (endAt: string): string {
    const date = dayjs(endAt)
    return date.format(date.year() === dayjs().year() ? 'D MMMM' : 'D MMMM YYYY')
}

function isForeverSubscription (endAt: string): boolean {
    return dayjs(endAt).diff(dayjs(), 'year') >= 10
}

function formatWholeCurrency (intl: IntlShape, amount: number, currencyCode: string): string {
    return intl.formatNumber(amount, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })
}

/**
 * "success" always carries a real event timestamp (the context's own createdAt) and needs no read-state.
 * "reminder"/"error" are synthesized fresh from "now" on every render, so their timestamp is frozen the
 * first time the notification dropdown closes while they're showing - otherwise they'd never age into "read"
 * and would keep jumping back to the top of the feed.
 */
type FreezableNotificationKind = 'reminder' | 'error'

const FROZEN_STORAGE_KEY: Record<FreezableNotificationKind, string> = {
    reminder: 'readPaymentReminderMessageAt',
    error: 'readPaymentErrorMessageAt',
}

/** An error notification re-opens as unread once a day for as long as the renewal keeps failing; a reminder freezes for good */
const EXPIRES_DAILY: Record<FreezableNotificationKind, boolean> = {
    reminder: false,
    error: true,
}

interface ReadMessageStorage {
    [messageId: string]: string
}

const isFreshEnough = (kind: FreezableNotificationKind, storedValue: string | undefined): boolean =>
    Boolean(storedValue) && (!EXPIRES_DAILY[kind] || isStoredToday(storedValue))

const getFrozenCreatedAt = (
    storage: LocalStorageManager<ReadMessageStorage> | null,
    kind: FreezableNotificationKind,
    messageId: string,
    now: string
): string => {
    const storedValue = storage?.getItem(FROZEN_STORAGE_KEY[kind])?.[messageId]
    return isFreshEnough(kind, storedValue) ? storedValue : now
}

/** Freezes every given message id that isn't already fresh, in one storage write */
const freezeMessageIds = (
    storage: LocalStorageManager<ReadMessageStorage> | null,
    kind: FreezableNotificationKind,
    messageIds: ReadonlyArray<string>
): void => {
    if (!storage || messageIds.length === 0) return

    const key = FROZEN_STORAGE_KEY[kind]
    const stored = storage.getItem(key) || {}
    const now = new Date().toISOString()
    const next = { ...stored }
    let changed = false

    for (const messageId of messageIds) {
        if (isFreshEnough(kind, next[messageId])) continue
        next[messageId] = now
        changed = true
    }

    if (changed) storage.setItem(key, next)
}

interface SubscriptionPaymentNotifications {
    messages: UserMessageType[]
    markReminderAsRead: () => void
    markErrorAsRead: () => void
}

/** The handful of context fields every notification rule below actually reads */
interface SubscriptionContextLike {
    id: string
    createdAt?: string | null
    endAt?: string | null
    startAt?: string | null
    status?: string | null
    bindingId?: string | null
    subscriptionPlan?: { name?: string | null, planType?: string | null } | null
    subscriptionPlanPricingRule?: { price?: string | null, currencyCode?: string | null } | null
}

type NotificationCandidateKind = 'reminder' | 'success' | 'error'

interface NotificationCandidate {
    id: string
    kind: NotificationCandidateKind
    title: string
    content: string
    /** Set only for 'success': its timestamp is the context's own, never frozen via storage */
    createdAt?: string
}

const MESSAGE_TYPE_BY_KIND: Record<NotificationCandidateKind, string> = {
    reminder: SUBSCRIPTION_PAYMENT_REMINDER_CUSTOM_CLIENT_MESSAGE_TYPE,
    success: SUBSCRIPTION_PAYMENT_SUCCESS_CUSTOM_CLIENT_MESSAGE_TYPE,
    error: SUBSCRIPTION_PAYMENT_ERROR_CUSTOM_CLIENT_MESSAGE_TYPE,
}

/** Designs spell every feature out as its own quoted name: «Маркетплейс», «Электронные квитанции» */
const featureNamesOf = (contexts: ReadonlyArray<SubscriptionContextLike>): string =>
    contexts.map(context => `«${context.subscriptionPlan?.name ?? ''}»`).join(', ')

/** A group is identified by the contexts in it, so a stable message id survives a re-render */
const groupIdOf = (contexts: ReadonlyArray<SubscriptionContextLike>): string =>
    contexts.map(context => context.id).sort().join('_')

/** Plan and feature messages of the same kind and end date would say the same thing twice, so they share one key */
const announcementKey = (kind: NotificationCandidateKind, endAt: string): string =>
    `${kind}:${dayjs(endAt).format('YYYY-MM-DD')}`

/** Groups feature contexts eligible for one kind of notification by their end date, skipping dates a plan-level message already covers */
const groupFeaturesByEndDate = (
    featureContexts: ReadonlyArray<SubscriptionContextLike>,
    kind: NotificationCandidateKind,
    announcedKeys: ReadonlySet<string>,
    isEligible: (context: SubscriptionContextLike) => boolean
): ReadonlyArray<SubscriptionContextLike[]> => {
    const groups = new Map<string, SubscriptionContextLike[]>()

    for (const context of featureContexts) {
        if (!context.endAt || !context.id || !context.subscriptionPlan?.name) continue
        if (!isEligible(context)) continue

        const key = announcementKey(kind, context.endAt)
        if (announcedKeys.has(key)) continue

        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(context)
    }

    return [...groups.values()]
}

/**
 * Builds every subscription-payment notification currently due: a service plan's own payment succeeded /
 * is due tomorrow / failed, and the same three for feature plans - grouped by end date, since several
 * features can renew (or fail to) on the same day and read as one message instead of a wall of them.
 */
function buildNotificationCandidates (
    intl: IntlShape,
    subscriptionContexts: ReadonlyArray<SubscriptionContextLike>,
    failedRenewals: ReadonlyArray<SubscriptionContextLike>,
    now: Dayjs
): ReadonlyArray<NotificationCandidate> {
    const candidates: NotificationCandidate[] = []
    const announcedByPlan = new Set<string>()

    const serviceContexts = subscriptionContexts.filter(context => context.subscriptionPlan?.planType !== SUBSCRIPTION_PLAN_TYPE_FEATURE)
    const featureContexts = subscriptionContexts.filter(context => context.subscriptionPlan?.planType === SUBSCRIPTION_PLAN_TYPE_FEATURE)
    const currentPlanName = serviceContexts.find(context => context.subscriptionPlan?.name)?.subscriptionPlan?.name || ''

    // A service plan's own payment: at most one success and one reminder message, each named after the plan
    for (const context of serviceContexts) {
        const { id: contextId, endAt, status, subscriptionPlan, subscriptionPlanPricingRule, createdAt, bindingId, startAt } = context
        const planName = subscriptionPlan?.name || ''
        const price = subscriptionPlanPricingRule?.price || ''
        const currencyCode = subscriptionPlanPricingRule?.currencyCode || ''

        if (!endAt || !planName || !contextId || status !== SUBSCRIPTION_CONTEXT_STATUS.DONE) continue

        const dayUntilEnd = dayjs(endAt).startOf('day').diff(now.startOf('day'), 'day')
        const daysSinceStarted = now.diff(dayjs(startAt), 'day')

        if (bindingId && daysSinceStarted <= SUBSCRIPTION_PAYMENT_BUFFER_DAYS && !isForeverSubscription(endAt)) {
            announcedByPlan.add(announcementKey('success', endAt))
            candidates.push({
                id: `subscription-payment-success-${contextId}`,
                kind: 'success',
                createdAt: dayjs(createdAt).toISOString(),
                title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_SUCCESS.title' }),
                content: intl.formatMessage(
                    { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_SUCCESS.content' },
                    { planName, date: formatPaidUntil(endAt) }
                ),
            })
        }

        if (dayUntilEnd === 1 && price && currencyCode) {
            announcedByPlan.add(announcementKey('reminder', endAt))
            candidates.push({
                id: `subscription-payment-reminder-${contextId}`,
                kind: 'reminder',
                title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_REMINDER.title' }),
                content: intl.formatMessage(
                    { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_REMINDER.content' },
                    { planName, price: formatWholeCurrency(intl, parseFloat(price), currencyCode) }
                ),
            })
        }
    }

    // A failed service-plan renewal. A renewal the card declined is a registration of its own and carries no
    // card, so it never shows up among the contexts paid by card - only card renewals are announced here:
    // an invoice nobody paid is not a failed payment
    for (const context of failedRenewals) {
        if (context.subscriptionPlan?.planType === SUBSCRIPTION_PLAN_TYPE_FEATURE || !context.endAt) continue

        announcedByPlan.add(announcementKey('error', context.endAt))
        candidates.push({
            id: `subscription-payment-error-${context.id}`,
            kind: 'error',
            title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_ERROR.title' }),
            content: intl.formatMessage(
                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_ERROR.content' },
                { planName: context.subscriptionPlan?.name || '' }
            ),
        })
    }

    for (const contexts of groupFeaturesByEndDate(featureContexts, 'success', announcedByPlan, context => (
        context.status === SUBSCRIPTION_CONTEXT_STATUS.DONE
        && Boolean(context.bindingId)
        && !isForeverSubscription(context.endAt)
        && now.diff(dayjs(context.startAt), 'day') <= SUBSCRIPTION_PAYMENT_BUFFER_DAYS
    ))) {
        candidates.push({
            id: `subscription-feature-payment-success-${groupIdOf(contexts)}`,
            kind: 'success',
            createdAt: dayjs(contexts[0].createdAt).toISOString(),
            title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_SUCCESS.features.title' }),
            content: intl.formatMessage(
                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_SUCCESS.features.content' },
                { features: featureNamesOf(contexts), date: formatPaidUntil(contexts[0].endAt) }
            ),
        })
    }

    for (const contexts of groupFeaturesByEndDate(featureContexts, 'reminder', announcedByPlan, context => (
        context.status === SUBSCRIPTION_CONTEXT_STATUS.DONE
        && Boolean(context.subscriptionPlanPricingRule?.price)
        && Boolean(context.subscriptionPlanPricingRule?.currencyCode)
        && dayjs(context.endAt).startOf('day').diff(now.startOf('day'), 'day') === 1
    ))) {
        const totalPrice = contexts.reduce((sum, context) => sum + parseFloat(context.subscriptionPlanPricingRule.price), 0)
        candidates.push({
            id: `subscription-feature-payment-reminder-${groupIdOf(contexts)}`,
            kind: 'reminder',
            title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_REMINDER.title' }),
            content: intl.formatMessage(
                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_REMINDER.features.content' },
                {
                    features: featureNamesOf(contexts),
                    planName: currentPlanName,
                    price: formatWholeCurrency(intl, totalPrice, contexts[0].subscriptionPlanPricingRule.currencyCode),
                }
            ),
        })
    }

    const failedFeatureRenewals = failedRenewals.filter(context => context.subscriptionPlan?.planType === SUBSCRIPTION_PLAN_TYPE_FEATURE)
    for (const contexts of groupFeaturesByEndDate(failedFeatureRenewals, 'error', announcedByPlan, () => true)) {
        candidates.push({
            id: `subscription-feature-payment-error-${groupIdOf(contexts)}`,
            kind: 'error',
            title: intl.formatMessage({ id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_ERROR.title' }),
            content: intl.formatMessage(
                { id: 'notification.UserMessagesList.message.SUBSCRIPTION_PAYMENT_ERROR.features.content' },
                { features: featureNamesOf(contexts), planName: currentPlanName }
            ),
        })
    }

    return candidates
}

export const useSubscriptionPaymentNotifications = (): SubscriptionPaymentNotifications => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const organizationId = organization?.id

    const { data: contextsData } = useGetOrganizationSubscriptionContextsWithPaymentMethodsQuery({
        variables: { organizationId: organizationId || '' },
        skip: !organizationId,
    })
    const subscriptionContexts = useMemo(() => contextsData?.subscriptionContexts || [], [contextsData?.subscriptionContexts])

    const { data: unpaidData } = useGetOrganizationUnpaidSubscriptionsQuery({
        variables: { organizationId: organizationId || '' },
        skip: !organizationId,
    })
    const failedRenewals = useMemo(() => (unpaidData?.unpaidSubscriptions || []).filter(context => (
        (context?.status === SUBSCRIPTION_CONTEXT_STATUS.ERROR || context?.status === SUBSCRIPTION_CONTEXT_STATUS.PENDING)
        && context?.frozenPaymentInfo?.paymentType === SUBSCRIPTION_PAYMENT_TYPE_CARD
        && !context?.renewalCancelledAt
    )), [unpaidData?.unpaidSubscriptions])

    const storage = useMemo(() => (typeof window === 'undefined' ? null : new LocalStorageManager<ReadMessageStorage>()), [])

    // ids of the reminder/error messages currently shown - refreshed every time `messages` recomputes,
    // read back by markReminderAsRead/markErrorAsRead whenever the notification dropdown closes
    const shownMessageIds = useRef<Record<FreezableNotificationKind, string[]>>({ reminder: [], error: [] })

    const messages = useMemo(() => {
        if (!organizationId || subscriptionContexts.length === 0) return []

        const now = dayjs()
        const nowIso = now.toISOString()
        const candidates = buildNotificationCandidates(intl, subscriptionContexts, failedRenewals, now)

        const reminderIds: string[] = []
        const errorIds: string[] = []

        const result = candidates.map(candidate => {
            let createdAt = candidate.createdAt

            if (candidate.kind === 'reminder') {
                reminderIds.push(candidate.id)
                createdAt = getFrozenCreatedAt(storage, 'reminder', candidate.id, nowIso)
            } else if (candidate.kind === 'error') {
                errorIds.push(candidate.id)
                createdAt = getFrozenCreatedAt(storage, 'error', candidate.id, nowIso)
            }

            return {
                id: candidate.id,
                type: MESSAGE_TYPE_BY_KIND[candidate.kind],
                createdAt,
                meta: { data: { url: `${serverUrl}/settings?tab=subscription` } },
                defaultContent: { content: candidate.content },
                customTitle: candidate.title,
            } as UserMessageType
        })

        shownMessageIds.current = { reminder: reminderIds, error: errorIds }
        return result
    }, [organizationId, subscriptionContexts, failedRenewals, intl, storage])

    const markReminderAsRead = useCallback(() => {
        freezeMessageIds(storage, 'reminder', shownMessageIds.current.reminder)
    }, [storage])

    const markErrorAsRead = useCallback(() => {
        freezeMessageIds(storage, 'error', shownMessageIds.current.error)
    }, [storage])

    return {
        messages,
        markReminderAsRead,
        markErrorAsRead,
    }
}
