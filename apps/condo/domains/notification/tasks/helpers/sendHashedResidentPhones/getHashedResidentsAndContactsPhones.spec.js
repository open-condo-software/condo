/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const get = require('lodash/get')

const { itemsQuery } = require('@open-condo/keystone/schema')
const { setFakeClientMode, catchErrorFrom, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { md5 } = require('@condo/domains/common/utils/crypto')
const { createTestContact } = require('@condo/domains/contact/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')

const { getHashedResidentsAndContactsPhones } = require('./getHashedResidentsAndContactsPhones')


function createTestPhoneWithCode () {
    return faker.phone.number('+7999#######')
}

describe('getHashedResidentsAndContactsPhones', () => {
    setFakeClientMode(index)
    jest.setTimeout(60000)

    const toEmail = 'test@example.com'
    const residentUsers = []
    const contacts = []

    let contactsWhere = {}
    let residentUsersWhere = {}

    beforeAll(async () => {
        const admin = await makeLoggedInAdminClient()

        for (let i = 0; i < 10; i++) {
            const residentUser = await makeClientWithResidentUser({}, { phone: createTestPhoneWithCode() })
            residentUsers.push(residentUser.user)
        }

        const [organization] = await createTestOrganization(admin)
        const [property] = await createTestProperty(admin, organization)

        for (let i = 0; i < 10; i++) {
            const [contact] = await createTestContact(admin, organization, property, {
                phone: createTestPhoneWithCode(),
            })
            contacts.push(contact)
        }

        contactsWhere = {
            id_in: contacts.map(({ id }) => id),
        }
        residentUsersWhere = {
            id_in: residentUsers.map(({ id }) => id),
        }
    })

    it('Correct data returns', async () => {
        const data = []

        await getHashedResidentsAndContactsPhones({
            contactsWhere,
            residentUsersWhere,
            toEmail,
            writePhoneCb: (hashedPhone) => data.push(hashedPhone),
        })

        const { count: contactsCount } = await itemsQuery('Contact', {
            where: contactsWhere,
        }, { meta: true })
        const { count: residentUsersCount } = await itemsQuery('User', {
            where: residentUsersWhere,
        }, { meta: true })

        const lineCounts = contactsCount + residentUsersCount + 1

        expect(data).toHaveLength(lineCounts)

        const contactPhone = get(contacts, '0.phone')
        const hashedContactPhone = md5(contactPhone.slice(1))

        expect(data).toContain(hashedContactPhone)
    })

    it('Insert identityHash in data', async () => {
        const data = []
        const identityHash = md5(`${dayjs().format('YYYY-MM-DD')}-${toEmail}`)

        await getHashedResidentsAndContactsPhones({
            contactsWhere,
            residentUsersWhere,
            toEmail,
            writePhoneCb: (hashedPhone) => data.push(hashedPhone),
        })

        expect(data.includes(identityHash)).toBeTruthy()
    })

    it('Throws error if no contacts and resident users', async () => {
        const data = []

        await catchErrorFrom(async () => {
            const neverCondition = {
                AND: [
                    { deletedAt: null },
                    { deletedAt_not: null },
                ],
            }

            await getHashedResidentsAndContactsPhones({
                contactsWhere: neverCondition,
                residentUsersWhere: neverCondition,
                toEmail,
                writePhoneCb: (hashedPhone) => data.push(hashedPhone),
            })
        }, (err) => {
            expect(err.message).toMatch('Empty contacts and resident users')
        })
    })
})