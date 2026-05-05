const { gql } = require('graphql-tag')

const { throwIfError } = require('@open-condo/codegen/generate.test.utils')
const { catchErrorFrom, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const {
    RENT_PAYMENT_METHOD_BANK_TRANSFER,
    RENT_PAYMENT_METHOD_CASH,
    RENT_PAYMENT_METHOD_MOMO,
    RENT_PAYMENT_PROVIDER_MANUAL,
} = require('@condo/domains/acquiring/constants/rentPayment')
const {
    recordManualRentPaymentByTestClient,
    reverseManualRentPaymentByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const {
    createTestBillingPolicy,
    createTestRentalUnit,
    createTestResident,
} = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

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
            status
            organization { id }
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

async function createPaymentLedgerEntry (client, ledger, organization, occupancy, payment, amount = payment.amount) {
    return await mutate(client, CREATE_LEDGER_ENTRY_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: `payment-entry-${payment.id.slice(0, 8)}` },
        organization: { connect: { id: organization.id } },
        ledger: { connect: { id: ledger.id } },
        tenant: { connect: { id: occupancy.tenant.id } },
        occupancy: { connect: { id: occupancy.id } },
        property: { connect: { id: occupancy.property.id } },
        rentalUnit: { connect: { id: occupancy.rentalUnit.id } },
        payment: { connect: { id: payment.id } },
        entryType: 'payment',
        direction: 'credit',
        amount,
        currencyCode: 'GHS',
        postingStatus: 'posted',
        description: `Manual payment duplicate ${payment.id}`,
    })
}

async function createUnconfirmedManualPayment (client, fixture, extraAttrs = {}) {
    return await mutate(client, CREATE_PAYMENT_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: `payment-${fixture.resident.id.slice(0, 8)}` },
        organization: { connect: { id: fixture.organization.id } },
        tenant: { connect: { id: fixture.resident.id } },
        occupancy: { connect: { id: fixture.occupancy.id } },
        property: { connect: { id: fixture.property.id } },
        rentalUnit: { connect: { id: fixture.rentalUnit.id } },
        amount: '50',
        currencyCode: 'GHS',
        period: '2026-05-01',
        purpose: 'Unconfirmed manual payment',
        recipientBic: 'MANUAL',
        recipientBankAccount: 'MANUAL',
        paymentMethod: RENT_PAYMENT_METHOD_CASH,
        provider: RENT_PAYMENT_PROVIDER_MANUAL,
        status: 'CREATED',
        ...extraAttrs,
    })
}

async function makeFixture ({ chargeAmounts = ['100'], organizationAttrs = { importId: 'GHORG' } } = {}) {
    const admin = await makeLoggedInAdminClient()
    const [organization] = await createTestOrganization(admin, organizationAttrs)
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

function buildPaymentData (fixture, extraAttrs = {}) {
    return {
        organization: { id: fixture.organization.id },
        tenant: { id: fixture.resident.id },
        occupancy: { id: fixture.occupancy.id },
        amount: '100',
        paymentMethod: RENT_PAYMENT_METHOD_CASH,
        confirmedAt: '2026-05-04T10:00:00.000Z',
        depositedDate: '2026-05-04T10:00:00.000Z',
        ...extraAttrs,
    }
}

function buildReversalData (fixture, payment, extraAttrs = {}) {
    return {
        organization: { id: fixture.organization.id },
        payment: { id: payment.id },
        reason: 'Cash entry recorded in error',
        ...extraAttrs,
    }
}

describe('RecordManualRentPaymentService', () => {
    test('records manual cash payment without reference', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })

        const [result] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '25',
        }))

        expect(result.payment.provider).toBe(RENT_PAYMENT_PROVIDER_MANUAL)
        expect(result.payment.paymentMethod).toBe(RENT_PAYMENT_METHOD_CASH)
        expect(result.payment.externalTransactionId).toBeNull()
        expect(result.receipt.reference).toBeNull()
        expect(result.allocations).toHaveLength(1)
        expect(result.allocations[0].amount).toBe('25.00000000')
    })

    test('records manual momo payment with reference', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })

        const [result] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '40',
            paymentMethod: RENT_PAYMENT_METHOD_MOMO,
            reference: 'MOMO-001',
        }))

        expect(result.payment.paymentMethod).toBe(RENT_PAYMENT_METHOD_MOMO)
        expect(result.payment.externalTransactionId).toBe('MOMO-001')
        expect(result.receipt.reference).toBe('MOMO-001')
    })

    test('records manual bank transfer payment with reference', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })

        const [result] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '60',
            paymentMethod: RENT_PAYMENT_METHOD_BANK_TRANSFER,
            reference: 'BANK-001',
        }))

        expect(result.payment.paymentMethod).toBe(RENT_PAYMENT_METHOD_BANK_TRANSFER)
        expect(result.payment.externalTransactionId).toBe('BANK-001')
        expect(result.receipt.reference).toBe('BANK-001')
    })

    test('rejects missing reference for momo and bank transfer', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })

        for (const paymentMethod of [RENT_PAYMENT_METHOD_MOMO, RENT_PAYMENT_METHOD_BANK_TRANSFER]) {
            await catchErrorFrom(async () => {
                await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
                    amount: '10',
                    paymentMethod,
                }))
            }, ({ errors }) => {
                expect(errors[0].extensions.message).toContain('must include a reference')
            })
        }
    })

    test('rejects duplicate manual references in the same organization and payment method', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100', '100'] })

        await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '10',
            paymentMethod: RENT_PAYMENT_METHOD_BANK_TRANSFER,
            reference: 'BANK-DUP',
        }))

        await catchErrorFrom(async () => {
            await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
                amount: '15',
                paymentMethod: RENT_PAYMENT_METHOD_BANK_TRANSFER,
                reference: 'BANK-DUP',
            }))
        }, ({ errors }) => {
            expect(errors[0].extensions.message).toContain('must be unique')
        })
    })

    test('allocates partial payment to oldest unpaid rent charge', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })

        const [result] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '40',
        }))

        expect(result.allocations).toEqual([
            expect.objectContaining({
                amount: '40.00000000',
                rentCharge: expect.objectContaining({
                    id: fixture.charges[0].id,
                    status: 'partially_paid',
                }),
            }),
        ])
        expect(result.ledgerBalance).toBe('60.00000000')
    })

    test('allocates exact payment and closes the charge', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })

        const [result] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '100',
        }))

        expect(result.allocations).toEqual([
            expect.objectContaining({
                amount: '100.00000000',
                rentCharge: expect.objectContaining({
                    id: fixture.charges[0].id,
                    status: 'paid',
                }),
            }),
        ])
        expect(result.ledgerBalance).toBe('0.00000000')
    })

    test('creates tenant credit on overpayment', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'] })

        const [result] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '150',
        }))

        expect(result.allocations).toHaveLength(1)
        expect(result.allocations[0].amount).toBe('100.00000000')
        expect(result.ledgerBalance).toBe('-50.00000000')
        expect(result.receipt.balanceAfterPayment).toBe('-50.00000000')
    })

    test('generates receipt after confirmation with organization code and payment metadata', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100'], organizationAttrs: { importId: 'GH-CODE' } })

        const [result] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '25',
            paymentMethod: RENT_PAYMENT_METHOD_MOMO,
            reference: 'RCPT-001',
        }))

        expect(result.payment.status).toBe('DONE')
        expect(result.receipt.number).toBe('GHCODE/2026/1')
        expect(result.receipt.paymentMethod).toBe(RENT_PAYMENT_METHOD_MOMO)
        expect(result.receipt.reference).toBe('RCPT-001')
        expect(result.receipt.issuedAt).toBe('2026-05-04T10:00:00.000Z')
    })

    test('updates ledger balance correctly when payment spans multiple charges', async () => {
        const fixture = await makeFixture({ chargeAmounts: ['100', '100'] })

        const [result] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, {
            amount: '150',
        }))

        expect(result.allocations).toHaveLength(2)
        expect(result.allocations[0]).toEqual(expect.objectContaining({ amount: '100.00000000' }))
        expect(result.allocations[1]).toEqual(expect.objectContaining({ amount: '50.00000000' }))
        expect(result.ledgerBalance).toBe('50.00000000')
        expect(result.receipt.balanceAfterPayment).toBe('50.00000000')
    })

    test('rejects cross-organization payment recording', async () => {
        const primaryFixture = await makeFixture({ chargeAmounts: ['100'] })
        const foreignFixture = await makeFixture({ chargeAmounts: ['100'], organizationAttrs: { importId: 'FOREIGN' } })

        await catchErrorFrom(async () => {
            await recordManualRentPaymentByTestClient(primaryFixture.admin, buildPaymentData(primaryFixture, {
                occupancy: { id: foreignFixture.occupancy.id },
            }))
        }, ({ errors }) => {
            expect(errors[0].extensions.message).toContain('must match for rent payments')
        })
    })

    describe('reverseManualRentPayment', () => {
        test('reverses exact payment with compensating records', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100'] })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '100' }))

            const [reversalResult] = await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment))

            expect(reversalResult.payment.status).toBe('REVERSED')
            expect(reversalResult.payment.reversalReason).toBe('Cash entry recorded in error')
            expect(reversalResult.payment.reversedAt).toBeTruthy()
            expect(reversalResult.payment.reversedBy.id).toBeTruthy()
            expect(reversalResult.payment.reversalLedgerEntry.id).toBe(reversalResult.ledgerEntry.id)
            expect(reversalResult.ledgerEntry.entryType).toBe('reversal')
            expect(reversalResult.ledgerEntry.direction).toBe('debit')
            expect(reversalResult.ledgerEntry.amount).toBe('100.00000000')
            expect(reversalResult.allocations).toEqual([
                expect.objectContaining({
                    amount: '-100.00000000',
                    rentCharge: expect.objectContaining({
                        id: fixture.charges[0].id,
                        status: 'invoiced',
                    }),
                }),
            ])
            expect(reversalResult.ledgerBalance).toBe('100.00000000')
        })

        test('reverses partial payment and restores charge status', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100'] })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '40' }))

            const [reversalResult] = await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment))

            expect(reversalResult.allocations).toHaveLength(1)
            expect(reversalResult.allocations[0].amount).toBe('-40.00000000')
            expect(reversalResult.rentCharges).toEqual([
                expect.objectContaining({
                    id: fixture.charges[0].id,
                    status: 'invoiced',
                }),
            ])
            expect(reversalResult.ledgerBalance).toBe('100.00000000')
        })

        test('reverses overpayment and restores tenant credit balance', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100'] })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '150' }))

            const [reversalResult] = await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment))

            expect(reversalResult.allocations).toHaveLength(1)
            expect(reversalResult.allocations[0].amount).toBe('-100.00000000')
            expect(reversalResult.ledgerBalance).toBe('100.00000000')
        })

        test('restores statuses for payments spanning multiple charges', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100', '100'] })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '150' }))

            const [reversalResult] = await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment))

            expect(reversalResult.rentCharges).toHaveLength(2)
            expect(reversalResult.rentCharges).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: fixture.charges[0].id, status: 'invoiced' }),
                expect.objectContaining({ id: fixture.charges[1].id, status: 'invoiced' }),
            ]))
        })

        test('restores ledger balance to the pre-payment value', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100', '100'] })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '150' }))

            const [reversalResult] = await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment))

            expect(reversalResult.ledgerBalance).toBe('200.00000000')
        })

        test('rejects duplicate reversal', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100'] })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '100' }))

            await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment))

            await catchErrorFrom(async () => {
                await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment))
            }, ({ errors }) => {
                expect(errors[0].extensions.message).toContain('already reversed')
            })
        })

        test('rejects reversal without reason', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100'] })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '100' }))

            await catchErrorFrom(async () => {
                await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment, {
                    reason: '   ',
                }))
            }, ({ errors }) => {
                expect(errors[0].extensions.message).toContain('Reason is required')
            })
        })

        test('rejects cross-organization reversal', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100'] })
            const foreignFixture = await makeFixture({ chargeAmounts: ['100'], organizationAttrs: { importId: 'FOREIGN-REV' } })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '100' }))

            await catchErrorFrom(async () => {
                await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment, {
                    organization: { id: foreignFixture.organization.id },
                }))
            }, ({ errors }) => {
                expect(errors[0].extensions.message).toContain('organization mismatch')
            })
        })

        test('rejects reversal of unconfirmed payment', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100'] })
            const payment = await createUnconfirmedManualPayment(fixture.admin, fixture)

            await catchErrorFrom(async () => {
                await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, payment))
            }, ({ errors }) => {
                expect(errors[0].extensions.message).toContain('only confirmed manual rent payments can be reversed')
            })
        })

        test('rejects reversal when dependent ledger data is inconsistent', async () => {
            const fixture = await makeFixture({ chargeAmounts: ['100'] })
            const [paymentResult] = await recordManualRentPaymentByTestClient(fixture.admin, buildPaymentData(fixture, { amount: '100' }))

            await createPaymentLedgerEntry(fixture.admin, fixture.ledger, fixture.organization, fixture.occupancy, paymentResult.payment)

            await catchErrorFrom(async () => {
                await reverseManualRentPaymentByTestClient(fixture.admin, buildReversalData(fixture, paymentResult.payment))
            }, ({ errors }) => {
                expect(errors[0].extensions.message).toContain('exactly one posted payment ledger entry')
            })
        })
    })
})
