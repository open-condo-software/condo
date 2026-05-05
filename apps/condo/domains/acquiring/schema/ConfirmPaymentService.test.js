const { gql } = require('graphql-tag')

const { throwIfError } = require('@open-condo/codegen/generate.test.utils')
const { closeKVClients } = require('@open-condo/keystone/kv')
const { find, getById } = require('@open-condo/keystone/schema')
const { catchErrorFrom, makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_PROCESSING_STATUS,
    PAYMENT_WITHDRAWN_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')
const { confirmPaymentByTestClient } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const {
    createTestBillingPolicy,
    createTestRentalUnit,
    createTestResident,
} = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

function initConfirmPaymentSchemaTestMode () {
    try {
        const index = require('@app/condo/index')
        setFakeClientMode(index)

        return { enabled: true, reason: null }
    } catch (error) {
        void closeKVClients()

        return {
            enabled: false,
            reason: [
                'ConfirmPaymentService.test.js requires either an in-process Condo Keystone test app',
                'or a prepared schema-test environment.',
                `In-process bootstrap failed: ${error.message}`,
            ].join(' '),
        }
    }
}

const confirmPaymentSchemaTestMode = initConfirmPaymentSchemaTestMode()
const describeConfirmPaymentService = confirmPaymentSchemaTestMode.enabled ? describe : describe.skip

if (!confirmPaymentSchemaTestMode.enabled) {
    test.skip(confirmPaymentSchemaTestMode.reason, () => {})
}

const CREATE_OCCUPANCY_MUTATION = gql`
    mutation createOccupancy ($data: OccupancyCreateInput) {
        obj: createOccupancy(data: $data) {
            id
            tenant { id }
            property { id }
            rentalUnit { id }
            organization { id }
        }
    }
`

const CREATE_RENT_CHARGE_MUTATION = gql`
    mutation createRentCharge ($data: RentChargeCreateInput) {
        obj: createRentCharge(data: $data) {
            id
            amount
            billingMonth
            status
            occupancy { id }
            property { id }
            rentalUnit { id }
            tenant { id }
        }
    }
`

const CREATE_TENANT_LEDGER_MUTATION = gql`
    mutation createTenantLedger ($data: TenantLedgerCreateInput) {
        obj: createTenantLedger(data: $data) {
            id
            organization { id }
            tenant { id }
            currencyCode
        }
    }
`

const CREATE_LEDGER_ENTRY_MUTATION = gql`
    mutation createLedgerEntry ($data: LedgerEntryCreateInput) {
        obj: createLedgerEntry(data: $data) {
            id
            amount
            entryType
            direction
            postingStatus
            payment { id }
            rentCharge { id }
        }
    }
`

const CREATE_PAYMENT_MUTATION = gql`
    mutation createPayment ($data: PaymentCreateInput!) {
        obj: createPayment(data: $data) {
            id
            amount
            currencyCode
            status
            provider
            providerReference
            externalTransactionId
            tenant { id }
        }
    }
`

async function mutate (client, query, data) {
    const { data: result, errors } = await client.mutate(query, { data })
    throwIfError(result, errors)

    return result.obj
}

async function createOccupancy (client, organization, resident, property, rentalUnit) {
    return await mutate(client, CREATE_OCCUPANCY_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: `occupancy-${resident.id.slice(0, 8)}` },
        organization: { connect: { id: organization.id } },
        tenant: { connect: { id: resident.id } },
        property: { connect: { id: property.id } },
        rentalUnit: { connect: { id: rentalUnit.id } },
        startDate: '2026-01-01',
        monthlyRate: '100',
    })
}

async function createRentCharge (client, organization, occupancy, billingMonth, amount) {
    return await mutate(client, CREATE_RENT_CHARGE_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: `charge-${billingMonth}` },
        organization: { connect: { id: organization.id } },
        occupancy: { connect: { id: occupancy.id } },
        property: { connect: { id: occupancy.property.id } },
        rentalUnit: { connect: { id: occupancy.rentalUnit.id } },
        billingMonth,
        periodStart: billingMonth,
        periodEnd: billingMonth === '2026-01-01' ? '2026-01-31' : billingMonth === '2026-02-01' ? '2026-02-28' : '2026-03-31',
        dueDate: billingMonth,
        currencyCode: 'GHS',
        amount,
    })
}

async function createTenantLedger (client, organization, tenant) {
    return await mutate(client, CREATE_TENANT_LEDGER_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: `ledger-${tenant.id.slice(0, 8)}` },
        organization: { connect: { id: organization.id } },
        tenant: { connect: { id: tenant.id } },
        currencyCode: 'GHS',
        status: 'active',
    })
}

async function createChargeLedgerEntry (client, ledger, organization, occupancy, rentCharge) {
    return await mutate(client, CREATE_LEDGER_ENTRY_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: `entry-${rentCharge.id.slice(0, 8)}` },
        organization: { connect: { id: organization.id } },
        ledger: { connect: { id: ledger.id } },
        tenant: { connect: { id: occupancy.tenant.id } },
        occupancy: { connect: { id: occupancy.id } },
        property: { connect: { id: occupancy.property.id } },
        rentalUnit: { connect: { id: occupancy.rentalUnit.id } },
        rentCharge: { connect: { id: rentCharge.id } },
        entryType: 'charge',
        direction: 'debit',
        amount: rentCharge.amount,
        currencyCode: 'GHS',
        postingStatus: 'posted',
        description: `Rent charge ${rentCharge.billingMonth}`,
    })
}

async function createPendingPayment (client, fixture, extraAttrs = {}) {
    return await mutate(client, CREATE_PAYMENT_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: `payment-${fixture.resident.id.slice(0, 8)}` },
        organization: { connect: { id: fixture.organization.id } },
        tenant: { connect: { id: fixture.resident.id } },
        occupancy: { connect: { id: fixture.occupancy.id } },
        property: { connect: { id: fixture.property.id } },
        rentalUnit: { connect: { id: fixture.rentalUnit.id } },
        amount: '150',
        currencyCode: 'GHS',
        period: '2026-05-01',
        purpose: 'Pending online rent payment',
        recipientBic: 'PENDING',
        recipientBankAccount: 'PENDING',
        provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        providerReference: 'paystack-init-ref-1',
        externalTransactionId: 'paystack-init-ref-1',
        status: PAYMENT_PROCESSING_STATUS,
        ...extraAttrs,
    })
}

async function makeFixture ({ chargeAmounts = ['100', '100'] } = {}) {
    const admin = await makeLoggedInAdminClient()
    const [organization] = await createTestOrganization(admin, { importId: 'GHCONFIRM' })
    const [property] = await createTestProperty(admin, organization)
    await createTestBillingPolicy(admin, organization, property)

    const residentClient = await makeClientWithNewRegisteredAndLoggedInUser()
    const [resident] = await createTestResident(admin, residentClient.user, property)
    const rentalUnit = await createTestRentalUnit(admin, organization, property)
    const occupancy = await createOccupancy(admin, organization, resident, property, rentalUnit)
    const ledger = await createTenantLedger(admin, organization, resident)

    const months = ['2026-01-01', '2026-02-01', '2026-03-01']
    const charges = []
    for (let index = 0; index < chargeAmounts.length; index += 1) {
        const charge = await createRentCharge(admin, organization, occupancy, months[index], chargeAmounts[index])
        await createChargeLedgerEntry(admin, ledger, organization, occupancy, charge)
        charges.push(charge)
    }

    return {
        admin,
        organization,
        property,
        resident,
        rentalUnit,
        occupancy,
        ledger,
        charges,
    }
}

function buildConfirmationData (extraAttrs = {}) {
    return {
        provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        providerReference: 'paystack-init-ref-1',
        externalTransactionId: 'paystack-charge-1',
        amount: '150',
        currencyCode: 'GHS',
        confirmedAt: '2026-05-05T09:30:00.000Z',
        ...extraAttrs,
    }
}

async function expectConfirmPaymentError (action, expectedError) {
    await catchErrorFrom(action, ({ errors }) => {
        expect(errors[0].extensions.code).toBe(expectedError.code)
        expect(errors[0].extensions.type).toBe(expectedError.type)
        expect(errors[0].extensions.message).toContain(expectedError.message)
    })
}

describeConfirmPaymentService('ConfirmPaymentService', () => {
    test('confirms a pending payment and triggers allocation plus ledger posting once', async () => {
        const fixture = await makeFixture()
        const payment = await createPendingPayment(fixture.admin, fixture)

        expect(await find('PaymentAllocation', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('PaymentReceipt', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('LedgerEntry', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(0)

        const [result] = await confirmPaymentByTestClient(fixture.admin, buildConfirmationData())

        expect(result.payment.id).toBe(payment.id)
        expect(result.payment.status).toBe('DONE')
        expect(result.payment.externalTransactionId).toBe('paystack-charge-1')
        expect(result.payment.confirmedAt).toBe('2026-05-05T09:30:00.000Z')
        expect(result.allocations.map(allocation => ({
            rentCharge: allocation.rentCharge.id,
            amount: allocation.amount,
        }))).toEqual([
            { rentCharge: fixture.charges[0].id, amount: '100.00000000' },
            { rentCharge: fixture.charges[1].id, amount: '50.00000000' },
        ])
        expect(result.receipt.reference).toBe('paystack-charge-1')
        expect(result.ledgerBalance).toBe('50.00000000')

        const paymentLedgerEntries = await find('LedgerEntry', {
            payment: { id: payment.id },
            deletedAt: null,
        })
        expect(paymentLedgerEntries).toHaveLength(1)
        expect(paymentLedgerEntries[0].amount).toBe('150.00000000')

        const refreshedCharges = await Promise.all(fixture.charges.map(charge => getById('RentCharge', charge.id)))
        expect(refreshedCharges).toEqual([
            expect.objectContaining({ id: fixture.charges[0].id, status: 'paid' }),
            expect.objectContaining({ id: fixture.charges[1].id, status: 'partially_paid' }),
        ])
    })

    test('returns the existing done state on duplicate confirmation without duplicating downstream effects', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })
        const payment = await createPendingPayment(fixture.admin, fixture, { amount: '100' })

        const [firstResult] = await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({ amount: '100' }))
        const [secondResult] = await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({ amount: '100' }))

        expect(secondResult.payment.id).toBe(firstResult.payment.id)
        expect(secondResult.payment.status).toBe('DONE')
        expect(secondResult.allocations).toEqual(firstResult.allocations)
        expect(secondResult.receipt.id).toBe(firstResult.receipt.id)
        expect(secondResult.ledgerBalance).toBe(firstResult.ledgerBalance)

        expect(await find('PaymentAllocation', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
        expect(await find('PaymentReceipt', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
        expect(await find('LedgerEntry', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
    })

    test('rejects duplicate confirmation of a done payment when the verified amount changes', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })
        const payment = await createPendingPayment(fixture.admin, fixture, { amount: '100' })

        await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({ amount: '100' }))

        await expectConfirmPaymentError(async () => {
            await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({ amount: '99' }))
        }, {
            code: 'BAD_USER_INPUT',
            type: 'PAYMENT_AMOUNT_MISMATCH',
            message: 'Confirmed amount does not match pending payment amount',
        })

        expect((await getById('Payment', payment.id)).status).toBe(PAYMENT_DONE_STATUS)
        expect(await find('PaymentAllocation', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
        expect(await find('PaymentReceipt', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
        expect(await find('LedgerEntry', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
    })

    test('rejects duplicate confirmation of a done payment when the verified currency changes', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })
        const payment = await createPendingPayment(fixture.admin, fixture, { amount: '100' })

        await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({ amount: '100' }))

        await expectConfirmPaymentError(async () => {
            await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({ amount: '100', currencyCode: 'USD' }))
        }, {
            code: 'BAD_USER_INPUT',
            type: 'PAYMENT_CURRENCY_MISMATCH',
            message: 'Confirmed currency does not match pending payment currency',
        })

        expect((await getById('Payment', payment.id)).status).toBe(PAYMENT_DONE_STATUS)
        expect(await find('PaymentAllocation', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
        expect(await find('PaymentReceipt', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
        expect(await find('LedgerEntry', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(1)
    })

    test('rejects mismatched confirmation amount and keeps the payment pending', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })
        const payment = await createPendingPayment(fixture.admin, fixture, { amount: '100' })

        await expectConfirmPaymentError(async () => {
            await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({ amount: '99' }))
        }, {
            code: 'BAD_USER_INPUT',
            type: 'PAYMENT_AMOUNT_MISMATCH',
            message: 'Confirmed amount does not match pending payment amount',
        })

        expect((await getById('Payment', payment.id)).status).toBe(PAYMENT_PROCESSING_STATUS)
        expect(await find('PaymentAllocation', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('PaymentReceipt', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('LedgerEntry', { payment: { id: payment.id }, deletedAt: null })).toHaveLength(0)
    })

    test('rejects confirmation for payments outside the PROCESSING to DONE transition', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })
        const errorPayment = await createPendingPayment(fixture.admin, fixture, {
            amount: '100',
            providerReference: 'paystack-error-ref-1',
            externalTransactionId: 'paystack-error-ref-1',
            status: PAYMENT_ERROR_STATUS,
        })
        const withdrawnPayment = await createPendingPayment(fixture.admin, fixture, {
            amount: '100',
            providerReference: 'paystack-withdrawn-ref-1',
            externalTransactionId: 'paystack-withdrawn-ref-1',
            status: PAYMENT_WITHDRAWN_STATUS,
        })

        await expectConfirmPaymentError(async () => {
            await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({
                providerReference: 'paystack-error-ref-1',
                externalTransactionId: 'paystack-error-charge-1',
                amount: '100',
            }))
        }, {
            code: 'BAD_USER_INPUT',
            type: 'PAYMENT_INVALID_STATUS_TRANSITION',
            message: 'Only PROCESSING to DONE payment confirmation is allowed',
        })

        await expectConfirmPaymentError(async () => {
            await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({
                providerReference: 'paystack-withdrawn-ref-1',
                externalTransactionId: 'paystack-withdrawn-charge-1',
                amount: '100',
            }))
        }, {
            code: 'BAD_USER_INPUT',
            type: 'PAYMENT_INVALID_STATUS_TRANSITION',
            message: 'Only PROCESSING to DONE payment confirmation is allowed',
        })

        expect((await getById('Payment', errorPayment.id)).status).toBe(PAYMENT_ERROR_STATUS)
        expect((await getById('Payment', withdrawnPayment.id)).status).toBe(PAYMENT_WITHDRAWN_STATUS)
        expect(await find('PaymentAllocation', { payment: { id: errorPayment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('PaymentAllocation', { payment: { id: withdrawnPayment.id }, deletedAt: null })).toHaveLength(0)
    })

    test('rejects ambiguous confirmation references when one provider reference maps to multiple payments', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })
        const firstPayment = await createPendingPayment(fixture.admin, fixture, {
            amount: '100',
            providerReference: 'paystack-ambiguous-ref-1',
            externalTransactionId: 'paystack-ambiguous-init-1',
        })
        const secondPayment = await createPendingPayment(fixture.admin, fixture, {
            amount: '100',
            providerReference: 'paystack-ambiguous-ref-1',
            externalTransactionId: 'paystack-ambiguous-init-2',
        })

        await expectConfirmPaymentError(async () => {
            await confirmPaymentByTestClient(fixture.admin, buildConfirmationData({
                providerReference: 'paystack-ambiguous-ref-1',
                externalTransactionId: 'paystack-ambiguous-charge-1',
                amount: '100',
            }))
        }, {
            code: 'BAD_USER_INPUT',
            type: 'PAYMENT_LOOKUP_AMBIGUOUS',
            message: 'Payment confirmation reference is ambiguous',
        })

        expect((await getById('Payment', firstPayment.id)).status).toBe(PAYMENT_PROCESSING_STATUS)
        expect((await getById('Payment', secondPayment.id)).status).toBe(PAYMENT_PROCESSING_STATUS)
        expect(await find('PaymentAllocation', { payment: { id: firstPayment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('PaymentAllocation', { payment: { id: secondPayment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('PaymentReceipt', { payment: { id: firstPayment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('PaymentReceipt', { payment: { id: secondPayment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('LedgerEntry', { payment: { id: firstPayment.id }, deletedAt: null })).toHaveLength(0)
        expect(await find('LedgerEntry', { payment: { id: secondPayment.id }, deletedAt: null })).toHaveLength(0)
    })
})
