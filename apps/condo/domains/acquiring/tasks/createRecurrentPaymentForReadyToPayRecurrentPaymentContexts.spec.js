/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const {
    setFakeClientMode,
    makeLoggedInAdminClient,
    setFeatureFlag,
} = require('@open-condo/keystone/test.utils')

const {
    RECURRENT_PAYMENT_INIT_STATUS, INSURANCE_BILLING_CATEGORY,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const { getAllReadyToPayRecurrentPaymentContexts, filterContextsByOrganizationSubscription } = require('@condo/domains/acquiring/utils/taskSchema')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    RecurrentPayment,
} = require('@condo/domains/acquiring/utils/testSchema')
const { updateTestBillingReceipt } = require('@condo/domains/billing/utils/testSchema')
const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const {
    RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { MESSAGE_FIELDS } = require('@condo/domains/notification/gql')
const {
    Message,
} = require('@condo/domains/notification/utils/serverSchema')
const {
    SubscriptionPlan,
    createTestSubscriptionPlan,
    createTestSubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')

const {
    createRecurrentPaymentForRecurrentPaymentContext,
} = require('./createRecurrentPaymentForReadyToPayRecurrentPaymentContexts')


const { keystone } = index

describe('create-recurrent-payment-for-ready-to-pay-recurrent-payment-contexts', () => {
    let adminContext, admin, getContextRequest
    setFakeClientMode(index)

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })

        admin = await makeLoggedInAdminClient()

        getContextRequest = (batch) => ({
            enabled: false,
            limit: '10000',
            autoPayReceipts: false,
            paymentDay: dayjs().date(),
            settings: { cardId: faker.datatype.uuid() },
            serviceConsumer: { connect: { id: batch.serviceConsumer.id } },
            billingCategory: { connect: { id: batch.billingReceipts[0].category.id } },
        })
    })

    it('should create RecurrentPayment for current period', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period)

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await createRecurrentPaymentForRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toBeNull()
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

    })

    it('should create RecurrentPayment for previous period', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period).startOf('month').add(1, 'month')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await createRecurrentPaymentForRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toBeNull()
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

    })

    it('should not create RecurrentPayment - no receipts for future period', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period).startOf('month').add(-1, 'month')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await createRecurrentPaymentForRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(0)

        const notifications = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, MESSAGE_FIELDS, {
            sortBy: 'createdAt_DESC',
        })
        expect(notifications).toHaveLength(1)
        const [notification] = notifications
        expect(notification).toBeDefined()
        expect(notification).toHaveProperty('user')
        expect(notification.user).toHaveProperty('id')
        expect(notification.user.id).toEqual(batch.resident.user.id)
        expect(notification).toHaveProperty('meta')
        expect(notification.meta).toHaveProperty('data')
        expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
        expect(notification.meta.data).toHaveProperty('serviceConsumerId')
        expect(notification.meta.data).toHaveProperty('residentId')
        expect(notification.meta.data).toHaveProperty('userId')

        expect(notification.meta.data).toMatchObject({
            recurrentPaymentContextId: recurrentPaymentContext.id,
            serviceConsumerId: batch.serviceConsumer.id,
            residentId: batch.resident.id,
            userId: batch.resident.user.id,
            url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}`,
        })
    })

    it('should not create RecurrentPayment - no receipts for past period', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period).startOf('month').add(3, 'month')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await createRecurrentPaymentForRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(0)

        const notifications = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, MESSAGE_FIELDS, {
            sortBy: 'createdAt_DESC',
        })
        expect(notifications).toHaveLength(1)
        const [notification] = notifications
        expect(notification).toBeDefined()
        expect(notification).toHaveProperty('user')
        expect(notification.user).toHaveProperty('id')
        expect(notification.user.id).toEqual(batch.resident.user.id)
        expect(notification).toHaveProperty('meta')
        expect(notification.meta).toHaveProperty('data')
        expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
        expect(notification.meta.data).toHaveProperty('serviceConsumerId')
        expect(notification.meta.data).toHaveProperty('residentId')
        expect(notification.meta.data).toHaveProperty('userId')

        expect(notification.meta.data).toMatchObject({
            recurrentPaymentContextId: recurrentPaymentContext.id,
            serviceConsumerId: batch.serviceConsumer.id,
            residentId: batch.resident.id,
            userId: batch.resident.user.id,
            url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}`,
        })
    })

    describe('subscription check', () => {
        let planWithPayments

        beforeAll(async () => {
            const [plan] = await createTestSubscriptionPlan(admin, { payments: true })
            planWithPayments = plan
        })

        afterAll(async () => {
            await SubscriptionPlan.softDelete(admin, planWithPayments.id)
        })

        beforeEach(() => { setFeatureFlag(SUBSCRIPTIONS, true) })
        afterEach(() => { setFeatureFlag(SUBSCRIPTIONS, false) })

        it('should not create RecurrentPayment when organization has no active payments subscription', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const [batch] = batches

            const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batch),
                enabled: true,
            })

            const page = await getAllReadyToPayRecurrentPaymentContexts(adminContext, dayjs(), 100, 0, { id_in: [recurrentPaymentContext.id] })
            const filtered = await filterContextsByOrganizationSubscription(adminContext, page)
            expect(filtered).toHaveLength(0)
        })

        it('should create RecurrentPayment when organization has active payments subscription', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const [batch] = batches
            await updateTestBillingReceipt(admin, batch.billingReceipts[0].id, { period: dayjs().startOf('month').format('YYYY-MM-DD') })

            const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batch),
                enabled: true,
            })

            await createTestSubscriptionContext(admin, { id: batch.serviceConsumer.organization.id }, planWithPayments, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
            })

            const page = await getAllReadyToPayRecurrentPaymentContexts(adminContext, dayjs(), 100, 0, { id_in: [recurrentPaymentContext.id] })
            expect(page).toHaveLength(1)

            await createRecurrentPaymentForRecurrentPaymentContext(adminContext, dayjs(), recurrentPaymentContext)

            const recurrentPayments = await RecurrentPayment.getAll(admin, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })
            expect(recurrentPayments.length).toBeGreaterThan(0)
        })
    })

    // TODO DOMA-11572
    it('should not create RecurrentPayment for INSURANCE category', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period).startOf('month').add(1, 'month')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
            billingCategory: null,
        })

        await updateTestBillingReceipt(admin, billingReceipts[0].id, { category: { connect: { id: INSURANCE_BILLING_CATEGORY } } })

        // create recurrent payments
        await createRecurrentPaymentForRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments

        expect(recurrentPayment.billingReceipts).toHaveLength(1) // without updated billingReceipts[0]

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[1].id)

    })
})
