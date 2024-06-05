const fs = require('fs')
const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const { stringify } = require('csv-stringify')
const dayjs = require('dayjs')
const FormData = require('form-data')
const { isFunction, map } = require('lodash')
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { itemsQuery } = require('@open-condo/keystone/schema')

const { md5 } = require('@condo/domains/common/utils/crypto')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { sleep } = require('@condo/domains/common/utils/sleep')
const { getTmpFile } = require('@condo/domains/common/utils/testSchema/file')
const { RESIDENT } = require('@condo/domains/user/constants/common')


const EMAIL_API_CONFIG = (conf.EMAIL_API_CONFIG) ? JSON.parse(conf.EMAIL_API_CONFIG) : null
const CHUNK_SIZE = 1000

const fileAdapter = new FileAdapter('hashed-resident-phones', true, true)

const queryAllItemsByChunks = async ({
    schemaName,
    where = {},
    chunkSize = 100,
    chunkProcessor = (chunk) => chunk,
}) => {
    let skip = 0
    let newChunk = []
    let all = []
    let newChunkLength

    do {
        await sleep(200)
        newChunk = await itemsQuery(schemaName, { where, first: chunkSize, skip, sortBy: ['id_ASC'] })
        newChunkLength = newChunk.length

        if (newChunkLength > 0) {
            if (isFunction(chunkProcessor)) {
                newChunk = chunkProcessor.constructor.name === 'AsyncFunction'
                    ? await chunkProcessor(newChunk)
                    : chunkProcessor(newChunk)
            }

            skip += newChunkLength
            all = all.concat(newChunk)
        }
    } while (newChunkLength)

    return all
}

async function sendHashedResidentPhones () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    // const { api_url, token, from } = EMAIL_API_CONFIG
    // const form = new FormData()
    //
    // form.append('from', from)
    // form.append('to', 'pgrachev@doma.ai')
    // form.append('subject', 'Выгрузка номеров')
    // form.append('text', 'Выгрузка номеров')

    console.log('after connect')

    const filename = 'hashed-resident-phones' //getTmpFile('csv')
    const writeStream = fs.createWriteStream(filename, { encoding: 'utf8' })

    console.log('after create write stream')

    const stringifier = stringify({ header: true, columns: ['phone'] })
    stringifier.pipe(writeStream)

    console.log('before load contact')

    await queryAllItemsByChunks({
        schemaName: 'Contact',
        where: { phone_not: null, deletedAt: null },
        chunkSize: CHUNK_SIZE,
        chunkProcessor: async (chunk) => {
            const phones = map(chunk, 'phone')

            for (const phone of phones) {
                const formattedPhone = phone.slice(1)

                if (/^7\d{10}$/.test(formattedPhone)) {
                    stringifier.write([md5(formattedPhone)])
                }
            }

            return []
        },
    })

    console.log('before load users')

    await queryAllItemsByChunks({
        schemaName: 'User',
        where: { type: RESIDENT, phone_not: null, deletedAt: null },
        chunkSize: CHUNK_SIZE,
        chunkProcessor: async (chunk) => {
            const phones = map(chunk, 'phone')

            for (const phone of phones) {
                const formattedPhone = phone.slice(1)

                if (/^7\d{10}$/.test(formattedPhone)) {
                    stringifier.write([md5(formattedPhone)])
                }
            }

            return []
        },
    })

    stringifier.end()

    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
    })

    const stream = fs.createReadStream(filename, { encoding: 'utf8' })

    console.log('before save file')

    await fileAdapter.save({
        stream,
        id: `${dayjs().format('YYYY-MM-DD_HH-mm-ss')}_${uuid()}`,
        filename: filename,
    }).then(({ filename, id }) => {
        const ret = {
            encoding: 'utf8',
            filename,
            id,
            mimetype: 'text/csv',
            originalFilename: filename,
            publicUrl: fileAdapter.publicUrl({ filename }),
        }

        if (fileAdapter.acl && fileAdapter.acl.generateUrl) {
            ret.publicUrl = fileAdapter.acl.generateUrl({
                filename: `${fileAdapter.folder}/${filename}`,
                originalFilename: filename,
            })
        }

        console.log('ret', ret)

        return ret
    })

    // form.append(
    //     'attachment',
    //     stream,
    //     {
    //         filename: filename,
    //         contentType: 'text/csv',
    //     }
    // )
    //
    // const auth = `api:${token}`
    // const result = await fetch(
    //     api_url,
    //     {
    //         method: 'POST',
    //         body: form,
    //         headers: {
    //             ...form.getHeaders(),
    //             'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
    //         },
    //     })
    //
    // return result.status
}

sendHashedResidentPhones().then(status => console.log(status))