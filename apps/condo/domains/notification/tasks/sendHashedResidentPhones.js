const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const { promisify } = require('util')

const { stringify } = require('csv-stringify')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { createTask } = require('@open-condo/keystone/tasks')

const { RESIDENT } = require('@condo/domains/user/constants/common')

const { getHashedResidentsAndContactsPhones, sendFileByEmail } = require('./helpers/sendHashedResidentPhones')


const rmfile = promisify(fs.unlink)

const EMAIL_API_CONFIG = (conf.EMAIL_API_CONFIG) ? JSON.parse(conf.EMAIL_API_CONFIG) : null
const MARKETING_EMAIL = conf.MARKETING_EMAIL || null

const REDIS_KEY = 'sendHashedResidentPhonesLastDate'

const taskLogger = getLogger()
const redisClient = getKVClient('sendHashedResidentPhones')


// TODO(DOMA-9341): extract staff users phones
async function sendHashedResidentPhones (userId) {
    taskLogger.info({
        msg: 'start of sendHashedResidentPhones task execution',
        entityId: userId,
        entity: 'User',
    })

    if (!EMAIL_API_CONFIG) {
        const msg = 'no EMAIL_API_CONFIG'
        taskLogger.error({
            msg: 'no EMAIL_API_CONFIG',
            entityId: userId,
            entity: 'User',
        })
        throw new Error(msg)
    }
    if (!MARKETING_EMAIL) {
        const msg = 'no MARKETING_EMAIL'
        taskLogger.error({
            msg,
            entityId: userId,
            entity: 'User',
        })
        throw new Error(msg)
    }

    const lastSyncDate = await redisClient.get(REDIS_KEY)
    if (!lastSyncDate) {
        // NOTE: keep message static
        const msg = `No last date in redis. Please set the ${REDIS_KEY} key with date (for example, "set ${REDIS_KEY} 2025-07-10T13:10:49.799Z}")`
        taskLogger.error({
            msg,
            entityId: userId,
            entity: 'User',
        })
        throw new Error(msg)
    }

    const where = {
        phone_starts_with_i: '+7',
        deletedAt: null,
    }
    if (lastSyncDate) {
        where.createdAt_gt = dayjs(lastSyncDate).toISOString()
    }
    const contactsWhere = { ...where }
    const residentUsersWhere = { ...where, type: RESIDENT }
    const filename = `${os.tmpdir()}/${crypto.randomBytes(6).hexSlice()}.csv`

    try {
        const writeStream = fs.createWriteStream(filename, { encoding: 'utf8' })
        const stringifier = stringify({ header: true, columns: ['phone'] })
        stringifier.pipe(writeStream)

        await getHashedResidentsAndContactsPhones({
            toEmail: MARKETING_EMAIL,
            contactsWhere,
            residentUsersWhere,
            writePhoneCb: (hashedPhone) => stringifier.write([hashedPhone]),
        })

        stringifier.end()

        taskLogger.info({
            msg: 'success load residents data',
            entityId: userId,
            entity: 'User',
        })

        const stream = fs.createReadStream(filename, { encoding: 'utf8' })
        const status = await sendFileByEmail({ stream, filename, config: EMAIL_API_CONFIG, toEmail: MARKETING_EMAIL })

        await redisClient.set(REDIS_KEY, dayjs().toISOString())

        taskLogger.info({
            msg: 'file sent to email',
            status,
            data: {
                email: MARKETING_EMAIL,
            },
            entityId: userId,
            entity: 'User',
        })
    } catch (error) {
        taskLogger.error({
            msg: 'error in sendHashedResidentPhones',
            err: error,
            entityId: userId,
            entity: 'User',
        })
    } finally {
        await rmfile(filename)
    }
}

const sendHashedResidentPhonesTask = createTask('sendHashedResidentPhones', sendHashedResidentPhones)

module.exports = {
    sendHashedResidentPhones,
    sendHashedResidentPhonesTask,
}
