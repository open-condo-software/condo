const fs = require('fs')
const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const { stringify } = require('csv-stringify')
const FormData = require('form-data')
const { map } = require('lodash')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { allItemsQueryByChunks } = require('@open-condo/keystone/schema')

const { md5 } = require('@condo/domains/common/utils/crypto')
const { getTmpFile } = require('@condo/domains/common/utils/testSchema/file')
const { RESIDENT } = require('@condo/domains/user/constants/common')


const EMAIL_API_CONFIG = (conf.EMAIL_API_CONFIG) ? JSON.parse(conf.EMAIL_API_CONFIG) : null
const CHUNK_SIZE = 1000

const IS_PHONE_REGEXP = /^\+79\d{9}$/

async function sendFileByEmail ({ stream, filename }) {
    const { api_url, token, from } = EMAIL_API_CONFIG
    const form = new FormData()

    form.append('from', from)
    form.append('to', 'pgrachev@doma.ai')
    form.append('subject', 'Выгрузка номеров')
    form.append('text', 'Выгрузка номеров')
    form.append(
        'attachment',
        stream,
        {
            filename: filename,
            contentType: 'text/csv',
        },
    )

    const auth = `api:${token}`
    const result = await fetch(
        api_url,
        {
            method: 'POST',
            body: form,
            headers: {
                ...form.getHeaders(),
                'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
            },
        })

    return result.status
}

async function sendHashedResidentPhones () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    const filename = getTmpFile('csv')
    const writeStream = fs.createWriteStream(filename, { encoding: 'utf8' })

    const stringifier = stringify({ header: true, columns: ['phone'] })
    stringifier.pipe(writeStream)

    const chunkProcessor = async (chunk) => {
        const phones = map(chunk, 'phone')

        for (const phone of phones) {
            if (IS_PHONE_REGEXP.test(phone)) {
                const formattedPhone = phone.slice(1)
                stringifier.write([md5(formattedPhone)])
            }
        }

        return []
    }

    await allItemsQueryByChunks({
        schemaName: 'Contact',
        where: { phone_not: null, deletedAt: null },
        chunkSize: CHUNK_SIZE,
        chunkProcessor,
    })

    await allItemsQueryByChunks({
        schemaName: 'User',
        where: { type: RESIDENT, phone_not: null, deletedAt: null },
        chunkSize: CHUNK_SIZE,
        chunkProcessor,
    })

    stringifier.end()

    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
    })

    const stream = fs.createReadStream(filename, { encoding: 'utf8' })

    await sendFileByEmail({ stream, filename })
}

sendHashedResidentPhones().then(status => console.log(status))