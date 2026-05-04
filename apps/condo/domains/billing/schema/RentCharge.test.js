/**
 * Integration spec note:
 * - This file uses makeLoggedInAdminClient from @open-condo/keystone/test.utils.
 * - In real-client mode it sends requests to ${SERVER_URL}/admin/api.
 * - apps/condo/.env sets SERVER_URL=http://localhost:4009 for local development.
 * - Start the API in a separate terminal before running this spec, for example:
 *   cd /workspaces/Kondo/apps/condo && SERVER_URL=http://localhost:4009 DISABLE_NEXT_APP=true NODE_ENV=development node ../../bin/run-keystone-app.js
 * - Then run the spec from the repo root:
 *   yarn workspace @app/condo test domains/billing/schema/RentCharge.test.js --runInBand
 */

const { faker } = require('@faker-js/faker')
const { gql } = require('graphql-tag')

const { throwIfError } = require('@open-condo/codegen/generate.test.utils')
const { catchErrorFrom, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const CREATE_RENTAL_UNIT_MUTATION = gql`
    mutation createRentalUnit ($data: RentalUnitCreateInput) {
        obj: createRentalUnit(data: $data) { id }
    }
`

const CREATE_OCCUPANCY_MUTATION = gql`
    mutation createOccupancy ($data: OccupancyCreateInput) {
        obj: createOccupancy(data: $data) {
            id
            property { id }
            rentalUnit { id }
        }
    }
`

const CREATE_BILLING_POLICY_MUTATION = gql`
    mutation createBillingPolicy ($data: BillingPolicyCreateInput) {
        obj: createBillingPolicy(data: $data) {
            id
        }
    }
`

const CREATE_RENT_CHARGE_MUTATION = gql`
    mutation createRentCharge ($data: RentChargeCreateInput) {
        obj: createRentCharge(data: $data) {
            id
            billingMonth
            occupancy { id }
            property { id }
            rentalUnit { id }
        }
    }
`

async function mutate (client, query, data) {
    const { data: result, errors } = await client.mutate(query, { data })
    throwIfError(result, errors)

    return result.obj
}

async function createRentalUnit (client, organization, property) {
    return await mutate(client, CREATE_RENTAL_UNIT_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        organization: { connect: { id: organization.id } },
        property: { connect: { id: property.id } },
        name: faker.random.alphaNumeric(8),
    })
}

async function createOccupancy (client, organization, resident, property, rentalUnit) {
    return await mutate(client, CREATE_OCCUPANCY_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        organization: { connect: { id: organization.id } },
        tenant: { connect: { id: resident.id } },
        property: { connect: { id: property.id } },
        rentalUnit: { connect: { id: rentalUnit.id } },
        startDate: new Date().toISOString().slice(0, 10),
        monthlyRate: '100',
    })
}

async function createBillingPolicy (client, organization, property) {
    return await mutate(client, CREATE_BILLING_POLICY_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        organization: { connect: { id: organization.id } },
        property: { connect: { id: property.id } },
    })
}

async function createRentCharge (client, organization, occupancy, billingMonth = '2026-04-01') {
    return await mutate(client, CREATE_RENT_CHARGE_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        organization: { connect: { id: organization.id } },
        occupancy: { connect: { id: occupancy.id } },
        property: { connect: { id: occupancy.property.id } },
        rentalUnit: { connect: { id: occupancy.rentalUnit.id } },
        billingMonth,
        periodStart: billingMonth,
        periodEnd: '2026-04-30',
        dueDate: billingMonth,
        currencyCode: 'RUB',
        amount: '100',
    })
}

describe('RentCharge invariants', () => {
    let admin
    let organization
    let property
    let resident
    let occupancy

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const organizationResult = await createTestOrganization(admin)
        organization = organizationResult[0]
        const propertyResult = await createTestProperty(admin, organization)
        property = propertyResult[0]
        const residentClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const residentResult = await createTestResident(admin, residentClient.user, property)
        resident = residentResult[0]
        await createBillingPolicy(admin, organization, property)
        const rentalUnit = await createRentalUnit(admin, organization, property)
        occupancy = await createOccupancy(admin, organization, resident, property, rentalUnit)
    })

    test('cannot create duplicate charge for same occupancy and billing month', async () => {
        await createRentCharge(admin, organization, occupancy)

        await catchErrorFrom(async () => {
            await createRentCharge(admin, organization, occupancy)
        }, ({ errors }) => {
            expect(errors[0].message).toContain('duplicate key value violates unique constraint')
            expect(errors[0].message).toContain('rent_charge_unique_occupancy_billing_month')
        })
    })
})
