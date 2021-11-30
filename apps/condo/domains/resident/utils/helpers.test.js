const faker = require('faker')
const get = require('lodash/get')

const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')

const { sleep } = require('@condo/domains/common/utils/sleep')

const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')

const { buildFakeAddressAndMeta } = require('@condo/domains/property/utils/testSchema/factories')
const { buildingMapJson } = require('@condo/domains/property/constants/property')
const { createTestProperty, Property } = require('@condo/domains/property/utils/testSchema')

const { registerResidentByTestClient, Resident } = require('@condo/domains/resident/utils/testSchema')

const { makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')

const { connectResidents } = require('./helpers')

// NOTE: here we test only 1 case: for forced re-connection of already connected to non-deleted property residents
// to oldest non-deleted property. All other cases are tested by the way in apps/condo/domains/resident/schema/RegisterResidentService.test.js
describe('connectResidents', () => {
    it('reconnects residents from younger property to restored older one', async () => {
        const { address, addressMeta } = buildFakeAddressAndMeta(true)
        const adminClient = await makeLoggedInAdminClient()
        const userClient = await makeClientWithResidentUser()
        const organizationClient = await makeClientWithRegisteredOrganization()
        const organizationClient1 = await makeClientWithRegisteredOrganization()

        // remove flat number from address for organization
        const orgAddressMeta = { ...addressMeta, value: address }
        const propertyPayload = { address, addressMeta: orgAddressMeta, map: buildingMapJson }
        const [property] = await createTestProperty(organizationClient, organizationClient.organization, propertyPayload)
        const [property1] = await createTestProperty(organizationClient1, organizationClient1.organization, propertyPayload)

        const [deletedProperty] = await Property.softDelete(organizationClient, property.id)

        expect(deletedProperty.deletedAt).not.toBeNull()

        // NOTE: give worker some time
        await sleep(1000)

        // resident should be connected to property1 automatically by RegisterResidentService custom mutation
        await registerResidentByTestClient(userClient, { address: addressMeta.value, addressMeta })

        const [resident] = await Resident.getAll(userClient, { id: userClient.id })

        // Resident should be connected to oldest non-deleted property1
        expect(get(resident, 'organization.id')).toEqual(organizationClient1.organization.id)
        expect(get(resident, 'property.id')).toEqual(property1.id)

        const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
        const restoredProperty = await Property.update(organizationClient, property.id, { deletedAt: null, dv: 1, sender })

        expect(restoredProperty.deletedAt).toBeNull()

        // NOTE: give worker some time
        await sleep(1000)

        const residents = await Resident.getAll(userClient, { id: userClient.id })

        // Resident should be still connected to oldest non-deleted property1
        expect(get(residents[0], 'organization.id')).toEqual(organizationClient1.organization.id)
        expect(get(residents[0], 'property.id')).toEqual(property1.id)

        await connectResidents(Resident, adminClient, residents, restoredProperty, true)

        // NOTE: give worker some time
        await sleep(1000)

        const [resident1] = await Resident.getAll(userClient, { id: userClient.id })

        // Resident should be connected to restoredProperty
        expect(get(resident1, 'organization.id')).toEqual(organizationClient.organization.id)
        expect(get(resident1, 'property.id')).toEqual(restoredProperty.id)
    })
})
