/**
 * @jest-environment node
 */

const { buildPlanCardAlerts } = require('./subscriptionPlanAlerts')

const now = new Date('2026-09-15T12:00:00Z')

const unpaid = (overrides) => ({
    id: 'ctx',
    status: 'CREATED',
    createdAt: '2026-09-14T12:00:00Z',
    endAt: '2026-10-14',
    subscriptionPlan: { id: 'start', name: 'Старт', planType: 'service' },
    subscriptionPlanPricingRule: { id: 'start-month' },
    frozenPaymentInfo: { paymentType: 'invoice' },
    ...overrides,
})

const feature = (id, name, overrides = {}) => unpaid({
    id: `${id}-ctx`,
    subscriptionPlan: { id, name, planType: 'feature' },
    subscriptionPlanPricingRule: { id: `${id}-month` },
    ...overrides,
})

const build = (overrides) => buildPlanCardAlerts({
    planId: 'start',
    isActivePlan: true,
    activeServiceContext: null,
    unpaidContexts: [],
    paidContexts: [],
    now,
    ...overrides,
})

describe('buildPlanCardAlerts', () => {
    it('has nothing to say when everything is paid', () => {
        expect(build()).toEqual([])
    })

    it('waits for an issued invoice for five days', () => {
        const [alert] = build({ unpaidContexts: [unpaid()] })

        expect(alert).toMatchObject({ type: 'invoicePending', scope: 'plan', daysLeft: 4, priceIds: ['start-month'] })
        expect(alert.deadline).toBe('2026-09-19T12:00:00.000Z')
    })

    it('asks for a new invoice once five days have passed', () => {
        const [alert] = build({ unpaidContexts: [unpaid({ createdAt: '2026-09-01T12:00:00Z' })] })

        expect(alert).toMatchObject({ type: 'invoiceExpired', scope: 'plan' })
    })

    it('reports a failed card renewal but not an abandoned card checkout', () => {
        expect(build({ unpaidContexts: [unpaid({ status: 'ERROR', frozenPaymentInfo: { paymentType: 'card' } })] })[0].type).toBe('cardFailed')
        expect(build({ unpaidContexts: [unpaid({ status: 'CREATED', frozenPaymentInfo: { paymentType: 'card' } })] })).toEqual([])
    })

    it('ignores registrations a paid context already covers or whose period is over', () => {
        expect(build({
            unpaidContexts: [unpaid()],
            paidContexts: [{ subscriptionPlan: { id: 'start' }, endAt: '2026-10-20' }],
        })).toEqual([])
        expect(build({ unpaidContexts: [unpaid({ endAt: '2026-09-10' })] })).toEqual([])
    })

    it('groups features in the same state into one alert on the active plan card only', () => {
        const unpaidContexts = [feature('receipts', 'Электронные квитанции'), feature('fiscalization', 'Фискализация')]

        const [alert] = build({ unpaidContexts })
        expect(alert).toMatchObject({ type: 'invoicePending', scope: 'features' })
        expect([...alert.planNames].sort()).toEqual(['Фискализация', 'Электронные квитанции'])
        expect([...alert.priceIds].sort()).toEqual(['fiscalization-month', 'receipts-month'])

        expect(build({ unpaidContexts, isActivePlan: false })).toEqual([])
    })

    it('shows the plan trial and its end on the active plan card', () => {
        const trial = { isTrial: true, subscriptionPlan: { id: 'start' } }

        expect(build({ activeServiceContext: { ...trial, endAt: '2026-09-22T12:00:00Z' } })[0]).toMatchObject({ type: 'trial', daysLeft: 7 })
        expect(build({ activeServiceContext: { ...trial, endAt: '2026-09-10T12:00:00Z' } })[0]).toMatchObject({ type: 'trialExpired' })
    })

    it('puts the most critical alert first and the plan before features', () => {
        const alerts = build({
            activeServiceContext: { isTrial: true, subscriptionPlan: { id: 'start' }, endAt: '2026-09-22T12:00:00Z' },
            unpaidContexts: [
                unpaid(),
                feature('receipts', 'Электронные квитанции', { status: 'PENDING', frozenPaymentInfo: { paymentType: 'card' } }),
                feature('news', 'Новости', { createdAt: '2026-09-14T12:00:00Z' }),
            ],
        })

        expect(alerts.map(({ type, scope }) => `${scope}-${type}`)).toEqual([
            'features-cardFailed',
            'plan-invoicePending',
            'features-invoicePending',
            'plan-trial',
        ])
    })
})
