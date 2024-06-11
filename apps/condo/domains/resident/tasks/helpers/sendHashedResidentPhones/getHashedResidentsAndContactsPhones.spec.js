const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { itemsQuery } = require('@open-condo/keystone/schema')
const { setFakeClientMode, catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { md5 } = require('@condo/domains/common/utils/crypto')
const { RESIDENT } = require('@condo/domains/user/constants/common')

const { getHashedResidentsAndContactsPhones } = require('./getHashedResidentsAndContactsPhones')


describe('getHashedResidentsAndContactsPhones', () => {
    const toEmail = 'test@example.com'

    setFakeClientMode(index, { excludeApps: ['NextApp', 'AdminUIApp', 'OIDCMiddleware'] })


    it('Correct data returns', async () => {
        const data = []

        await getHashedResidentsAndContactsPhones({
            toEmail,
            writePhoneCb: (hashedPhone) => data.push(hashedPhone),
        })

        const where = {
            phone_contains_i: '+7',
            deletedAt: null,
        }
        const { count: contactsCount } = await itemsQuery('Contact', {
            where,
        }, { meta: true })
        const { count: residentUsersCount } = await itemsQuery('User', {
            where: { ...where, type: RESIDENT },
        }, { meta: true })

        const lineCounts = contactsCount + residentUsersCount + 1

        expect(data).toHaveLength(lineCounts)
    })

    it('Insert identityHash in data', async () => {
        const data = []
        const identityHash = md5(`${dayjs().format('YYYY-MM-DD')}-${toEmail}`)

        await getHashedResidentsAndContactsPhones({
            toEmail,
            writePhoneCb: (hashedPhone) => data.push(hashedPhone),
        })

        expect(data.includes(identityHash)).toBeTruthy()
    })

    it('Throws error if no contacts and resident users', async () => {
        const data = []

        await catchErrorFrom(async () => {
            await getHashedResidentsAndContactsPhones({
                toEmail,
                writePhoneCb: (hashedPhone) => data.push(hashedPhone),
                lastSyncDate: dayjs().toISOString(),
            })
        }, (err) => {
            expect(err.message).toMatch('Empty contacts and resident users')
        })
    })
})