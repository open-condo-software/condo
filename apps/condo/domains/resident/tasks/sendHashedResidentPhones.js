const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const { promisify } = require('util')

const { stringify } = require('csv-stringify')
const dayjs = require('dayjs')
const FormData = require('form-data')
const { map } = require('lodash')
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { allItemsQueryByChunks, itemsQuery } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { md5 } = require('@condo/domains/common/utils/crypto')
const { RESIDENT } = require('@condo/domains/user/constants/common')


const rmfile = promisify(fs.unlink)

const EMAIL_API_CONFIG = (conf.EMAIL_API_CONFIG) ? JSON.parse(conf.EMAIL_API_CONFIG) : null
const MARKETING_EMAIL = conf.MARKETING_EMAIL || null

const CHUNK_SIZE = 1000
const REDIS_KEY = 'sendHashedResidentPhonesLastDate'

const taskLogger = getLogger('sendHashedResidentPhones')
const redisClient = getRedisClient('sendHashedResidentPhones')

async function sendFileByEmail ({ stream, filename }) {
    const { api_url, token, from } = EMAIL_API_CONFIG
    const form = new FormData()

    form.append('from', from)
    form.append('to', MARKETING_EMAIL)
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
    const taskId = uuid()

    taskLogger.info({ msg: 'Start of sendHashedResidentPhones task execution', taskId })

    if (!EMAIL_API_CONFIG) {
        const msg = 'no EMAIL_API_CONFIG'
        taskLogger.error({ msg: 'no EMAIL_API_CONFIG', taskId })
        throw new Error(msg)
    }
    if (!MARKETING_EMAIL) {
        const msg = 'no MARKETING_EMAIL'
        taskLogger.error({ msg, taskId })
        throw new Error(msg)
    }

    const lastDate = await redisClient.get(REDIS_KEY)
    if (!lastDate) {
        const msg = `No last date in redis. Please set the ${REDIS_KEY} key with date (for example, "set ${REDIS_KEY} ${dayjs().toISOString()}")`
        taskLogger.error({ msg })
        throw new Error(msg)
    }

    try {
        const filename = `${os.tmpdir()}/${crypto.randomBytes(6).hexSlice()}.csv`
        const writeStream = fs.createWriteStream(filename, { encoding: 'utf8' })
        const stringifier = stringify({ header: true, columns: ['phone'] })

        const createdAt_gt = dayjs(lastDate).toISOString()
        const contactsWhere = {
            createdAt_gt,
            phone_contains_i: '+7',
            deletedAt: null,
        }
        const residentUserWhere = {
            createdAt_gt,
            type: RESIDENT,
            phone_contains_i: '+7',
            deletedAt: null,
        }

        const { count: contactsCount } = await itemsQuery('Contact', {
            where: contactsWhere,
        }, { meta: true })
        const { count: residentUsersCount } = await itemsQuery('User', {
            where: residentUserWhere,
        }, { meta: true })

        const maxLine = contactsCount + residentUsersCount
        if (maxLine === 0) {
            const msg = 'Empty contacts and resident users'
            taskLogger.error({ msg, taskId })
            throw new Error(msg)
        }

        stringifier.pipe(writeStream)
        const lineWithIdentityHash = Math.floor(Math.random() * maxLine)
        let lineNum = 0

        const chunkProcessor = async (chunk) => {
            const phones = map(chunk, 'phone')

            for (const phone of phones) {
                const formattedPhone = phone.slice(1)
                stringifier.write([md5(formattedPhone)])

                if (lineNum === lineWithIdentityHash) {
                    // Hash to identify file: when and where was it sent. Example: 2024-05-30-example@example.com
                    const identityHash = md5(`${dayjs().format('YYYY-MM-DD')}-${MARKETING_EMAIL}`)
                    stringifier.write([identityHash])
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
            where: residentUserWhere,
            chunkSize: CHUNK_SIZE,
            chunkProcessor,
        })

        stringifier.end()

        taskLogger.info({ msg: 'Success load residents data', taskId })

        const stream = fs.createReadStream(filename, { encoding: 'utf8' })
        const status = await sendFileByEmail({ stream, filename })

        await redisClient.set(REDIS_KEY, dayjs().toISOString())

        await rmfile(filename)

        taskLogger.info({ msg: 'File sent to email', taskId, status, toEmail: MARKETING_EMAIL })
    } catch (error) {
        taskLogger.error({ msg: 'Error in sendHashedResidentPhones', error, taskId })
    }
}

// cron: every 5th day of month
const sendHashedResidentPhonesTask = createCronTask('sendHashedResidentPhones', '0 0 5 * *', sendHashedResidentPhones)

module.exports = {
    sendHashedResidentPhones,
    sendHashedResidentPhonesTask,
}