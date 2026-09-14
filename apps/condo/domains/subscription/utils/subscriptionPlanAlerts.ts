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
}

export type UnpaidSubscriptionContext = {
    id: string
    status?: string | null
    createdAt?: string | null
    endAt?: string | null
    subscriptionPlan?: { id: string, name?: string | null, planType?: string | null } | null
    subscriptionPlanPricingRule?: { id: string } | null
    frozenPaymentInfo?: { paymentType?: string | null } | null
}

export type PaidSubscriptionContext = {
    endAt?: string | null
    subscriptionPlan?: { id: string } | null
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
const getLatestUnpaidByPlanId = (
    unpaidContexts: ReadonlyArray<UnpaidSubscriptionContext>,
    paidContexts: ReadonlyArray<PaidSubscriptionContext>,
    now: Date,
): Map<string, UnpaidSubscriptionContext> => {
    const latest = new Map<string, UnpaidSubscriptionContext>()
    const sorted = [...unpaidContexts].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

    for (const context of sorted) {
        const planId = context.subscriptionPlan?.id
        if (!planId || !context.endAt || !context.createdAt || latest.has(planId) || new Date(context.endAt) <= now) continue

        const isCovered = paidContexts.some(paid => (
            paid.subscriptionPlan?.id === planId && paid.endAt && new Date(paid.endAt) >= new Date(context.endAt)
        ))
        if (!isCovered) latest.set(planId, context)
    }

    return latest
}

type BuildPlanCardAlertsParams = {
    planId: string
    isActivePlan: boolean
    activeServiceContext: ServiceSubscriptionContext | null
    unpaidContexts: ReadonlyArray<UnpaidSubscriptionContext>
    paidContexts: ReadonlyArray<PaidSubscriptionContext>
    now: Date
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
    now,
}: BuildPlanCardAlertsParams): ReadonlyArray<PlanAlert> => {
    const alerts: PlanAlert[] = []
    const latestUnpaidByPlanId = getLatestUnpaidByPlanId(unpaidContexts, paidContexts, now)

    const planContext = latestUnpaidByPlanId.get(planId)
    const planState = planContext ? resolveUnpaidState(planContext, now) : null
    if (planContext && planState) {
        alerts.push({
            key: `plan-${planState.type}`,
            scope: 'plan',
            planNames: [planContext.subscriptionPlan?.name ?? ''],
            priceIds: planContext.subscriptionPlanPricingRule?.id ? [planContext.subscriptionPlanPricingRule.id] : [],
            ...planState,
        })
    }

    if (isActivePlan) {
        const featureAlerts = new Map<PlanAlertType, PlanAlert>()
        for (const context of latestUnpaidByPlanId.values()) {
            if (context.subscriptionPlan?.planType !== 'feature') continue
            const state = resolveUnpaidState(context, now)
            if (!state) continue

            const known = featureAlerts.get(state.type)
            const priceIds = context.subscriptionPlanPricingRule?.id ? [context.subscriptionPlanPricingRule.id] : []
            if (!known) {
                featureAlerts.set(state.type, { key: `features-${state.type}`, scope: 'features', planNames: [context.subscriptionPlan.name ?? ''], priceIds, ...state })
                continue
            }

            // the earliest deadline among the grouped invoices is the one the client has to meet
            const isEarlier = state.deadline && known.deadline && new Date(state.deadline) < new Date(known.deadline)
            featureAlerts.set(state.type, {
                ...known,
                planNames: [...known.planNames, context.subscriptionPlan.name ?? ''],
                priceIds: [...known.priceIds, ...priceIds],
                ...(isEarlier && { daysLeft: state.daysLeft, deadline: state.deadline }),
            })
        }
        alerts.push(...featureAlerts.values())

        if (activeServiceContext?.isTrial && activeServiceContext.subscriptionPlan?.id === planId && activeServiceContext.endAt) {
            const trialEnd = new Date(activeServiceContext.endAt)
            alerts.push(trialEnd > now
                ? { key: 'plan-trial', type: 'trial', scope: 'plan', planNames: [], daysLeft: daysUntil(trialEnd, now), deadline: null, priceIds: [] }
                : { key: 'plan-trialExpired', type: 'trialExpired', scope: 'plan', planNames: [], daysLeft: 0, deadline: null, priceIds: [] })
        }
    }

    return alerts.sort((left, right) => (
        SEVERITY[left.type] - SEVERITY[right.type]
        || Number(left.scope === 'features') - Number(right.scope === 'features')
    ))
}
