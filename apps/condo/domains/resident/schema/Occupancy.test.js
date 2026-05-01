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
        obj: createRentalUnit(data: $data) {
            id
            name
            unitType
            capacity
            property { id }
            organization { id }
        }
    }
`

const CREATE_OCCUPANCY_MUTATION = gql`
    mutation createOccupancy ($data: OccupancyCreateInput) {
        obj: createOccupancy(data: $data) {
            id
            status
            tenant { id }
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

async function mutate (client, query, data) {
    const { data: result, errors } = await client.mutate(query, { data })
    throwIfError(result, errors)

    return result.obj
}

async function createRentalUnit (client, organization, property, extraAttrs = {}) {
    return await mutate(client, CREATE_RENTAL_UNIT_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        organization: { connect: { id: organization.id } },
        property: { connect: { id: property.id } },
        name: faker.random.alphaNumeric(8),
        capacity: 1,
        ...extraAttrs,
    })
}

async function createBillingPolicy (client, organization, property, extraAttrs = {}) {
    return await mutate(client, CREATE_BILLING_POLICY_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        organization: { connect: { id: organization.id } },
        property: { connect: { id: property.id } },
        ...extraAttrs,
    })
}

async function createOccupancy (client, organization, resident, property, rentalUnit, extraAttrs = {}) {
    return await mutate(client, CREATE_OCCUPANCY_MUTATION, {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        organization: { connect: { id: organization.id } },
        tenant: { connect: { id: resident.id } },
        property: { connect: { id: property.id } },
        rentalUnit: { connect: { id: rentalUnit.id } },
        startDate: new Date().toISOString().slice(0, 10),
        monthlyRate: '100',
        ...extraAttrs,
    })
}

async function createResidentForProperty (admin, property) {
    const residentClient = await makeClientWithNewRegisteredAndLoggedInUser()
    const [resident] = await createTestResident(admin, residentClient.user, property)

    return resident
}

describe('Occupancy invariants', () => {
    let admin
    let organization
    let property

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const organizationResult = await createTestOrganization(admin)
        organization = organizationResult[0]
        const propertyResult = await createTestProperty(admin, organization)
        property = propertyResult[0]
    })

    test('cannot create active occupancy for non-rentable rental unit', async () => {
        const resident = await createResidentForProperty(admin, property)
        const rentalUnit = await createRentalUnit(admin, organization, property, { rentable: false })

        await catchErrorFrom(async () => {
            await createOccupancy(admin, organization, resident, property, rentalUnit)
        }, ({ errors }) => {
            expect(errors[0].message).toContain('Occupancy must be linked to a rentable rental unit')
        })
    })

    test('cannot exceed rental unit active occupancy capacity', async () => {
        const firstResident = await createResidentForProperty(admin, property)
        const secondResident = await createResidentForProperty(admin, property)
        const rentalUnit = await createRentalUnit(admin, organization, property, { capacity: 1 })
        await createBillingPolicy(admin, organization, property)

        await createOccupancy(admin, organization, firstResident, property, rentalUnit)

        await catchErrorFrom(async () => {
            await createOccupancy(admin, organization, secondResident, property, rentalUnit)
        }, ({ errors }) => {
            expect(errors[0].message).toContain('Rental unit active occupancy capacity is exceeded')
        })
    })

    test('concurrent active occupancy attempts cannot exceed capacity', async () => {
        const firstResident = await createResidentForProperty(admin, property)
        const secondResident = await createResidentForProperty(admin, property)
        const rentalUnit = await createRentalUnit(admin, organization, property, { capacity: 1 })
        await createBillingPolicy(admin, organization, property)

        const results = await Promise.allSettled([
            createOccupancy(admin, organization, firstResident, property, rentalUnit),
            createOccupancy(admin, organization, secondResident, property, rentalUnit),
        ])

        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
        expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
    })

    test('cannot create second active occupancy for same tenant', async () => {
        const resident = await createResidentForProperty(admin, property)
        const firstRentalUnit = await createRentalUnit(admin, organization, property)
        const secondRentalUnit = await createRentalUnit(admin, organization, property)
        await createBillingPolicy(admin, organization, property)

        await createOccupancy(admin, organization, resident, property, firstRentalUnit)

        await catchErrorFrom(async () => {
            await createOccupancy(admin, organization, resident, property, secondRentalUnit)
        }, ({ errors }) => {
            expect(errors[0].message).toContain('Tenant already has an active occupancy')
        })
    })

    test('cannot create occupancy with property outside rental unit scope', async () => {
        const resident = await createResidentForProperty(admin, property)
        const rentalUnit = await createRentalUnit(admin, organization, property)
        const [otherProperty] = await createTestProperty(admin, organization)

        await catchErrorFrom(async () => {
            await createOccupancy(admin, organization, resident, otherProperty, rentalUnit)
        }, ({ errors }) => {
            expect(errors[0].message).toContain('Occupancy organization, property and rental unit must match')
        })
    })
})
