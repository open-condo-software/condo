const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const { promisify } = require('util')

const { stringify } = require('csv-stringify')
const dayjs = require('dayjs')
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { RESIDENT } = require('@condo/domains/user/constants/common')

const { getHashedResidentsAndContactsPhones, sendFileByEmail } = require('./helpers/sendHashedResidentPhones')


const rmfile = promisify(fs.unlink)

const EMAIL_API_CONFIG = (conf.EMAIL_API_CONFIG) ? JSON.parse(conf.EMAIL_API_CONFIG) : null
const MARKETING_EMAIL = conf.MARKETING_EMAIL || null

const REDIS_KEY = 'sendHashedResidentPhonesLastDate'

const taskLogger = getLogger('sendHashedResidentPhones')
const redisClient = getRedisClient('sendHashedResidentPhones')


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

    const lastSyncDate = await redisClient.get(REDIS_KEY)
    if (!lastSyncDate) {
        const msg = `No last date in redis. Please set the ${REDIS_KEY} key with date (for example, "set ${REDIS_KEY} ${dayjs().toISOString()}")`
        taskLogger.error({ msg, taskId })
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

        taskLogger.info({ msg: 'Success load residents data', taskId })

        const stream = fs.createReadStream(filename, { encoding: 'utf8' })
        const status = await sendFileByEmail({ stream, filename, config: EMAIL_API_CONFIG, toEmail: MARKETING_EMAIL })

        await redisClient.set(REDIS_KEY, dayjs().toISOString())

        taskLogger.info({ msg: 'File sent to email', taskId, status, toEmail: MARKETING_EMAIL })
    } catch (error) {
        taskLogger.error({ msg: 'Error in sendHashedResidentPhones', error, taskId })
    } finally {
        await rmfile(filename)
    }
}

// cron: At 02:30 on day-of-month 5 in every 3rd month
const sendHashedResidentPhonesTask = createCronTask('sendHashedResidentPhones', '30 2 5 */3 *', sendHashedResidentPhones)

module.exports = {
    sendHashedResidentPhones,
    sendHashedResidentPhonesTask,
}