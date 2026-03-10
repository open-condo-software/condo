const crypto = require('crypto')

const dayjs = require('dayjs')
const map = require('lodash/map')

const { allItemsQueryByChunks, itemsQuery } = require('@open-condo/keystone/schema')

const { md5 } = require('@condo/domains/common/utils/crypto')


const CHUNK_SIZE = 1000
const PHONE_REGEXP = /^\+7\d{10}$/

async function getHashedResidentsAndContactsPhones ({ contactsWhere, residentUsersWhere, toEmail, writePhoneCb }) {
    const { count: contactsCount } = await itemsQuery('Contact', {
        where: contactsWhere,
    }, { meta: true })
    const { count: residentUsersCount } = await itemsQuery('User', {
        where: residentUsersWhere,
    }, { meta: true })

    const maxLine = contactsCount + residentUsersCount
    if (maxLine === 0) {
        const msg = 'Empty contacts and resident users'
        throw new Error(msg)
    }

    const lineWithIdentityHash = crypto.randomInt(maxLine)
    let lineNum = 0

    const chunkProcessor = async (chunk) => {
        const phones = map(chunk, 'phone')

        for (const phone of phones) {
            if (PHONE_REGEXP.test(phone)) {
                const formattedPhone = phone.slice(1)
                writePhoneCb(md5(formattedPhone))
            }

            if (lineNum === lineWithIdentityHash) {
                // Hash to identify file: when and where was it sent. Example: 2024-05-30-example@example.com
                const identityHash = md5(`${dayjs().format('YYYY-MM-DD')}-${toEmail}`)
                writePhoneCb(identityHash)
            }

            lineNum++
        }

        return []
    }

    await allItemsQueryByChunks({
        schemaName: 'Contact',
        where: contactsWhere,
        chunkSize: CHUNK_SIZE,
        chunkProcessor,
    })

    await allItemsQueryByChunks({
        schemaName: 'User',
        where: residentUsersWhere,
        chunkSize: CHUNK_SIZE,
        chunkProcessor,
    })
}

module.exports = {
    getHashedResidentsAndContactsPhones,
}