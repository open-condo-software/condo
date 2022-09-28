/**
 * @type {Cypress.PluginConfig}
 */
const isEmpty = require('lodash/isEmpty')
const { makeLoggedInAdminClient } = require('@condo/keystone/test.utils')
const {
    createTestUser,
    createTestForgotPasswordAction,
    ConfirmPhoneAction,
    makeLoggedInClient,
    makeClientWithSupportUser, updateTestUser,
} = require('@condo/domains/user/utils/testSchema')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { createTestTicket, createTestTicketClassifier } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { buildingMapJson } = require('@condo/domains/property/constants/property')
const faker = require('faker')
const { AddressMetaDataFields } = require('@condo/domains/property/schema/fields/AddressMetaField')
const { sample } = require('lodash')
const { Property } = require('@condo/domains/property/utils/testSchema')

let userObject = {}
let supportObject = {}

const FIAS_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 35, 65, 75, 90, 91]
const FIAS_ACTUALITY_STATE = [0, 1]

// 'г Екатеринбург, ул Пушкина, д 1'
const buildAddressMeta = (withFlat = false) => {
    const emptyData = Object.assign( {}, ...Object.keys(AddressMetaDataFields).map((field) => ({ [field]: null })))
    emptyData.postal_code = faker.address.zipCode()
    emptyData.country = faker.address.country()
    emptyData.country_iso_code = faker.address.countryCode()
    emptyData.capital_marker = String(faker.datatype.number())

    emptyData.fias_id = faker.datatype.uuid()
    emptyData.fias_level = String(sample(FIAS_LEVELS))
    emptyData.fias_code = String(faker.datatype.number())
    emptyData.fias_actuality_state = String(sample(FIAS_ACTUALITY_STATE))
    emptyData.kladr_id = String(faker.datatype.number())
    emptyData.geoname_id = String(faker.datatype.number())
    emptyData.okato = String(faker.datatype.number())
    emptyData.oktmo = String(faker.datatype.number())
    emptyData.tax_office = String(faker.datatype.number())
    emptyData.tax_office_legal = String(faker.datatype.number())
    emptyData.qc_geo = String(faker.datatype.number())

    emptyData.city = 'Екатеринбург'
    emptyData.city_type = 'г'
    emptyData.city_type_full = 'город'
    emptyData.city_with_type = `${emptyData.city_type} ${emptyData.city}`
    emptyData.city_fias_id = faker.datatype.uuid()
    emptyData.city_kladr_id = String(faker.datatype.number())

    emptyData.street = 'Пушкина'
    emptyData.street_type = 'ул'
    emptyData.street_type_full = 'улица'
    emptyData.street_with_type = `${emptyData.street_type} ${emptyData.street}`
    emptyData.street_fias_id = faker.datatype.uuid()
    emptyData.street_kladr_id = String(faker.datatype.number())

    emptyData.house = '1'
    emptyData.house_type = 'д'
    emptyData.house_type_full = 'дом'
    emptyData.house_fias_id = faker.datatype.uuid()
    emptyData.house_kladr_id = String(faker.datatype.number())

    emptyData.block = ''
    emptyData.block_type = ''
    emptyData.block_type_full = 'блок'

    emptyData.region = ''
    emptyData.region_iso_code = faker.address.stateAbbr()
    emptyData.region_type_full = 'регион'
    emptyData.region_type = 'р'
    // emptyData.region_with_type = `${emptyData.region_type} ${emptyData.region}`
    emptyData.region_fias_id = faker.datatype.uuid()
    emptyData.region_kladr_id = String(faker.datatype.number())


    if (withFlat) {
        emptyData.flat = String(faker.datatype.number())
        emptyData.flat_type = 'кв'
        emptyData.flat_type_full = 'квартира'
    }

    emptyData.geo_lat = faker.address.latitude()
    emptyData.geo_lon = faker.address.longitude()

    const fullHouseName = [emptyData.house_type, emptyData.house, emptyData.block_type, emptyData.block]
        .filter(Boolean)
        .join(' ')
    const flat = emptyData.flat ? `${emptyData.flat_type} ${emptyData.flat}` : null
    const value = [emptyData.region_with_type, emptyData.city_with_type, emptyData.street_with_type, fullHouseName, flat]
        .filter(Boolean)
        .join(', ')
    const unrestrictedValue = [emptyData.postal_code, value].join(', ')
    return {
        dv: 1,
        data: emptyData,
        value,
        unrestricted_value: unrestrictedValue,
    }
}

const makeClientWithProperty = async () => {
    const client = await makeClientWithRegisteredOrganization()
    const addressMeta = buildAddressMeta(false)
    let address = addressMeta.value

    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const name = faker.address.streetAddress(true)
    const attrs = {
        dv: 1,
        sender,
        organization: { connect: { id: client.organization.id } },
        type: 'building',
        name,
        address,
        addressMeta,
        map: buildingMapJson,
    }
    client.property = await Property.create(client, attrs)

    return client
}

module.exports = async (on, config) => {

    const admin = await makeLoggedInAdminClient()

    on('task', {
        async 'keystone:createUser' () {
            return await createTestUser(admin)
        },
        async 'keystone:createForgotPasswordAction' (user) {
            return await createTestForgotPasswordAction(admin, user)
        },
        async 'keystone:getConfirmPhoneAction' (phone) {
            return await ConfirmPhoneAction.getAll(admin, { phone })
        },
        async 'keystone:createUserWithProperty' () {
            if (isEmpty(userObject)) {
                const result = await makeClientWithProperty()
                const client = await makeLoggedInClient(result.userAttrs)
                const cookie = client.getCookie()

                const organizationLink = await OrganizationEmployee.getOne(client, {
                    user: { id: result.userAttrs.id }, isRejected: false, isBlocked: false,
                })
                const user = Object.assign({}, result.user)
                userObject = Object.assign({}, {
                    user,
                    property: result.property,
                    cookie,
                    organizationLinkId: organizationLink.id,
                    userAttrs: result.userAttrs,
                    organization: result.organization,
                })

                return userObject
            }

            return userObject

        },
        async 'keystone:createSupportWithProperty' () {
            if (isEmpty(supportObject)) {
                const result = await makeClientWithProperty()
                const client = await makeLoggedInClient(result.userAttrs)
                const cookie = client.getCookie()

                const organizationLink = await OrganizationEmployee.getOne(client, {
                    user: { id: result.userAttrs.id }, isRejected: false, isBlocked: false,
                })

                await updateTestUser(admin, organizationLink.user.id, {
                    isSupport: true,
                })

                const user = Object.assign({}, result.userAttrs)
                supportObject = Object.assign({}, {
                    user,
                    property: result.property,
                    cookie,
                    organizationLinkId: organizationLink.id,
                    userAttrs: result.userAttrs,
                    organization: result.organization,
                })

                return supportObject
            }

            return supportObject

        },
        async 'keystone:createTickets' (ticketAttrs) {
            const client = await makeLoggedInClient(ticketAttrs.userAttrs)
            const support = await makeClientWithSupportUser()
            const [ticketClassifier] = await createTestTicketClassifier(support)

            const classifier = { connect: { id: ticketClassifier.id } }
            const ticketExtraFields = { classifier }

            const [ticket] = await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isWarranty: true, ...ticketExtraFields })
            await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isEmergency: true, ...ticketExtraFields })
            await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isPaid: true, ...ticketExtraFields })
            return ticket
        },
    })

    return config

}
