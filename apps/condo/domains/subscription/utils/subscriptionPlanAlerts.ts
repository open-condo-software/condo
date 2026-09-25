import dayjs from 'dayjs'

import { SUBSCRIPTION_PAYMENT_TYPE_CARD, SUBSCRIPTION_PAYMENT_TYPE_INVOICE } from '@condo/domains/subscription/constants'


/** How long an issued invoice waits for the payment before a new one has to be issued */
export const INVOICE_PAYMENT_DAYS = 5

const DAY_MS = 24 * 60 * 60 * 1000

export type PlanAlertType = 'cardFailed' | 'invoiceExpired' | 'trialExpired' | 'invoicePending' | 'trial'

/** An alert either speaks about the plan itself or about features bought on top of it */
export type PlanAlertScope = 'plan' | 'features'

export type PlanAlert = {
    key: string
    type: PlanAlertType
    scope: PlanAlertScope
    planNames: ReadonlyArray<string>
    daysLeft: number
    /** Last day an issued invoice can be paid */
    deadline: string | null
    /** Pricing rules to issue a new invoice for */
    priceIds: ReadonlyArray<string>
    /** Unpaid registrations behind the alert, their invoice can be asked for again */
    contextIds: ReadonlyArray<string>
}

export type UnpaidSubscriptionContext = {
    id: string
    status?: string | null
    createdAt?: string | null
    endAt?: string | null
    subscriptionPlan?: { id: string, name?: string | null, planType?: string | null } | null
    subscriptionPlanPricingRule?: { id: string } | null
    frozenPaymentInfo?: { paymentType?: string | null } | null
    /** Set once the organization removed the registration from its subscription, it is not waited for anymore */
    renewalCancelledAt?: string | null
}

export type PaidSubscriptionContext = {
    endAt?: string | null
    subscriptionPlan?: { id: string } | null
}

export type TrialSubscriptionContext = {
    endAt?: string | null
    subscriptionPlan?: { id?: string | null } | null
}

export type ServiceSubscriptionContext = {
    isTrial?: boolean | null
    endAt?: string | null
    subscriptionPlan?: { id?: string | null } | null
}

const SEVERITY: Record<PlanAlertType, number> = {
    cardFailed: 0,
    invoiceExpired: 1,
    trialExpired: 2,
    invoicePending: 3,
    trial: 4,
}

const daysUntil = (date: Date, now: Date): number => Math.max(0, Math.ceil((date.getTime() - now.getTime()) / DAY_MS))

/**
 * A trial period is stored as a calendar date, so it is measured in whole days in the viewer's timezone.
 * Measuring it as an instant counts one day too many for everyone east of UTC until UTC catches up.
 */
const asDay = (value: string | Date): dayjs.Dayjs => dayjs(value).startOf('day')

/** Abandoned card checkouts stay CREATED too, they are not something to warn about */
const resolveUnpaidState = (context: UnpaidSubscriptionContext, now: Date): Pick<PlanAlert, 'type' | 'daysLeft' | 'deadline'> | null => {
    const paymentType = context.frozenPaymentInfo?.paymentType

    if (paymentType === SUBSCRIPTION_PAYMENT_TYPE_INVOICE && context.status === 'CREATED') {
        const deadline = new Date(new Date(context.createdAt).getTime() + INVOICE_PAYMENT_DAYS * DAY_MS)
        return deadline > now
            ? { type: 'invoicePending', daysLeft: daysUntil(deadline, now), deadline: deadline.toISOString() }
            : { type: 'invoiceExpired', daysLeft: 0, deadline: deadline.toISOString() }
    }

    if (paymentType === SUBSCRIPTION_PAYMENT_TYPE_CARD && (context.status === 'PENDING' || context.status === 'ERROR')) {
        return { type: 'cardFailed', daysLeft: 0, deadline: null }
    }

    return null
}

/**
 * The latest unpaid registration of every plan, as long as it still matters: its period has not run out and no
 * paid context of the same plan already covers it
 */
const getLatestUnpaidByPlanId = <T extends UnpaidSubscriptionContext>(
    unpaidContexts: ReadonlyArray<T>,
    paidContexts: ReadonlyArray<PaidSubscriptionContext>,
    now: Date,
): Map<string, T> => {
    const latest = new Map<string, T | null>()
    const sorted = [...unpaidContexts].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

    for (const context of sorted) {
        const planId = context.subscriptionPlan?.id
        if (!planId || !context.endAt || !context.createdAt || latest.has(planId) || new Date(context.endAt) <= now) continue
        // a removed registration still hides older ones of the same plan: they were superseded by it
        if (context.renewalCancelledAt) {
            latest.set(planId, null)
            continue
        }

        const isCovered = paidContexts.some(paid => (
            paid.subscriptionPlan?.id === planId && paid.endAt && new Date(paid.endAt) >= new Date(context.endAt)
        ))
        if (!isCovered) latest.set(planId, context)
    }

    return new Map([...latest].filter((entry): entry is [string, T] => Boolean(entry[1])))
}

export type OutstandingPayment<T extends UnpaidSubscriptionContext> = Pick<PlanAlert, 'type' | 'daysLeft' | 'deadline'> & {
    context: T
}

/** Registrations the organization still has to pay for, the same ones the plan cards warn about */
export const getOutstandingPayments = <T extends UnpaidSubscriptionContext>(
    unpaidContexts: ReadonlyArray<T>,
    paidContexts: ReadonlyArray<PaidSubscriptionContext>,
    now: Date,
): ReadonlyArray<OutstandingPayment<T>> => {
    const payments: OutstandingPayment<T>[] = []
    for (const context of getLatestUnpaidByPlanId(unpaidContexts, paidContexts, now).values()) {
        const state = resolveUnpaidState(context, now)
        if (state) payments.push({ context, ...state })
    }

    return payments
}

type BuildPlanCardAlertsParams = {
    planId: string
    isActivePlan: boolean
    activeServiceContext: ServiceSubscriptionContext | null
    unpaidContexts: ReadonlyArray<UnpaidSubscriptionContext>
    paidContexts: ReadonlyArray<PaidSubscriptionContext>
    /** Trials the organization ever had, a plan whose trial ran out asks to be paid for */
    trialContexts?: ReadonlyArray<TrialSubscriptionContext>
    /** The plan is already paid for, so its trial is nothing to warn about anymore */
    isPlanPaid?: boolean
    now: Date
}

const trialExpiredAlert = (): PlanAlert => ({
    key: 'plan-trialExpired', type: 'trialExpired', scope: 'plan', planNames: [], daysLeft: 0, deadline: null, priceIds: [], contextIds: [],
})

const buildPlanAlert = (context: UnpaidSubscriptionContext | undefined, now: Date): PlanAlert | null => {
    const state = context && resolveUnpaidState(context, now)
    if (!context || !state) return null

    return {
        key: `plan-${state.type}`,
        scope: 'plan',
        planNames: [context.subscriptionPlan?.name ?? ''],
        priceIds: context.subscriptionPlanPricingRule?.id ? [context.subscriptionPlanPricingRule.id] : [],
        contextIds: [context.id],
        ...state,
    }
}

const mergeFeatureAlert = (
    known: PlanAlert,
    context: UnpaidSubscriptionContext,
    state: Pick<PlanAlert, 'type' | 'daysLeft' | 'deadline'>,
    priceIds: ReadonlyArray<string>,
): PlanAlert => {
    // the earliest deadline among the grouped invoices is the one the client has to meet
    const isEarlier = state.deadline && known.deadline && new Date(state.deadline) < new Date(known.deadline)

    return {
        ...known,
        planNames: [...known.planNames, context.subscriptionPlan.name ?? ''],
        priceIds: [...known.priceIds, ...priceIds],
        contextIds: [...known.contextIds, context.id],
        ...(isEarlier && { daysLeft: state.daysLeft, deadline: state.deadline }),
    }
}

/** One alert per state, naming every feature waiting for that same payment */
const buildFeatureAlerts = (
    latestUnpaidByPlanId: ReadonlyMap<string, UnpaidSubscriptionContext>,
    now: Date,
): ReadonlyArray<PlanAlert> => {
    const alertsByType = new Map<PlanAlertType, PlanAlert>()

    for (const context of latestUnpaidByPlanId.values()) {
        if (context.subscriptionPlan?.planType !== 'feature') continue
        const state = resolveUnpaidState(context, now)
        if (!state) continue

        const known = alertsByType.get(state.type)
        const priceIds = context.subscriptionPlanPricingRule?.id ? [context.subscriptionPlanPricingRule.id] : []

        alertsByType.set(state.type, known ? mergeFeatureAlert(known, context, state, priceIds) : {
            key: `features-${state.type}`,
            scope: 'features',
            planNames: [context.subscriptionPlan.name ?? ''],
            priceIds,
            contextIds: [context.id],
            ...state,
        })
    }

    return [...alertsByType.values()]
}

/** a trial paid for before it ran out is just a plan now, whatever date the paid period starts on */
const buildTrialAlert = (
    planId: string,
    activeServiceContext: ServiceSubscriptionContext | null,
    isPlanPaid: boolean,
    now: Date,
): PlanAlert | null => {
    if (isPlanPaid || !activeServiceContext?.isTrial) return null
    if (activeServiceContext.subscriptionPlan?.id !== planId || !activeServiceContext.endAt) return null

    const trialEnd = asDay(activeServiceContext.endAt)
    const today = asDay(now)
    if (!trialEnd.isAfter(today)) return trialExpiredAlert()

    return { key: 'plan-trial', type: 'trial', scope: 'plan', planNames: [], daysLeft: trialEnd.diff(today, 'day'), deadline: null, priceIds: [], contextIds: [] }
}

const hasUnpaidTrialToBuy = (
    planId: string,
    trialContexts: ReadonlyArray<TrialSubscriptionContext>,
    paidContexts: ReadonlyArray<PaidSubscriptionContext>,
    now: Date,
): boolean => {
    const isTrialOver = trialContexts.some(trial => trial.subscriptionPlan?.id === planId && trial.endAt && new Date(trial.endAt) <= now)
    const isPaid = paidContexts.some(paid => paid.subscriptionPlan?.id === planId && paid.endAt && new Date(paid.endAt) > now)

    return isTrialOver && !isPaid
}

/**
 * Alerts of a plan card, most critical first. The card of the plan warns about its own unpaid invoice or payment;
 * the active plan card also warns about its trial and about features bought on top of it, one alert per state.
 * Feature trials stay in the feature table.
 */
export const buildPlanCardAlerts = ({
    planId,
    isActivePlan,
    activeServiceContext,
    unpaidContexts,
    paidContexts,
    trialContexts = [],
    isPlanPaid = false,
    now,
}: BuildPlanCardAlertsParams): ReadonlyArray<PlanAlert> => {
    const alerts: PlanAlert[] = []
    const latestUnpaidByPlanId = getLatestUnpaidByPlanId(unpaidContexts, paidContexts, now)

    const planAlert = buildPlanAlert(latestUnpaidByPlanId.get(planId), now)
    if (planAlert) alerts.push(planAlert)

    if (isActivePlan) {
        alerts.push(...buildFeatureAlerts(latestUnpaidByPlanId, now))

        const trialAlert = buildTrialAlert(planId, activeServiceContext, isPlanPaid, now)
        if (trialAlert) alerts.push(trialAlert)
    }

    // Without a running plan the organization cannot use the platform, so a plan whose trial ran out asks to be paid
    const hasRunningServicePlan = Boolean(activeServiceContext?.endAt && new Date(activeServiceContext.endAt) > now)
    const asksToBePaid = !isActivePlan && !hasRunningServicePlan && !isPlanPaid
        && !alerts.some(alert => alert.scope === 'plan')
        && hasUnpaidTrialToBuy(planId, trialContexts, paidContexts, now)
    if (asksToBePaid) alerts.push(trialExpiredAlert())

    return alerts.sort((left, right) => (
        SEVERITY[left.type] - SEVERITY[right.type]
        || Number(left.scope === 'features') - Number(right.scope === 'features')
    ))
}
