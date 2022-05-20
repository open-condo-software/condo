const dayjs = require('dayjs')
const { getSchemaCtx } = require('@core/keystone/schema')
const { Meter } = require('@condo/domains/meter/utils/serverSchema')
const { sendMessage, Message } = require('@condo/domains/notification/utils/serverSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { Resident, ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { get, flatten, uniq } = require('lodash')
const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')
const { METER_VERIFICATION_DATE_REMINDER_TYPE } = require('@condo/domains/notification/constants/constants')

const readMetersPage = async ({ context, offset, pageSize, date, searchWindowDaysShift, daysCount }) => {
    // calc window
    const startWindowDate = dayjs(date).add(searchWindowDaysShift, 'day').format('YYYY-MM-DD')
    const endWindowDate = dayjs(date)
        .add(searchWindowDaysShift + daysCount + 1, 'day')
        .format('YYYY-MM-DD')

    return await Meter.getAll(
        context, {
            nextVerificationDate_gte: startWindowDate,
            nextVerificationDate_lte: endWindowDate,
        }, {
            sortBy: 'id_ASC',
            first: pageSize,
            skip: offset,
        }
    )
}

const getMetersConnectedWithResidents = async ({ context, meters }) => {
    // first step is get service consumers by accountNumbers
    const accountNumbers = uniq(meters.map(meter => meter.accountNumber))
    const servicesConsumers = await loadListByChunks({
        context,
        list: ServiceConsumer,
        where: {
            accountNumber_in: accountNumbers,
        },
    })

    // second step is to get all resident ids
    const residentsIds = uniq(servicesConsumers.map(item => item.resident.id))

    // now let's get residents for the list of ids
    const residents = await loadListByChunks({
        context,
        list: Resident,
        where: {
            id_in: residentsIds,
        },
    })

    // next step - connect residents to services consumers
    const servicesConsumerWithConnectedResidents = servicesConsumers.map(servicesConsumer => {
        return {
            servicesConsumer,
            residents: residents.filter(resident => resident.id === servicesConsumer.resident.id),
        }
    })

    // next step - connect meters to residents using previously created connection
    return meters
        .map(meter => {
            const servicesConsumers = servicesConsumerWithConnectedResidents
                .filter(item => item.servicesConsumer.accountNumber === meter.accountNumber)
            const residents = flatten(
                servicesConsumers.map(item =>
                    item.residents.filter(resident =>
                        resident.unitName === meter.unitName
                    )
                )
            )

            return {
                meter,
                servicesConsumers,
                residents,
            }
        })
        .filter(item => item.residents.length > 0)
}

const filterSentReminders = async ({ context, date, reminderWindowSize, metersConnectedWithResidents }) => {
    // let's get all user in those reminders
    const users = uniq(flatten(metersConnectedWithResidents.map(item => item.residents.map(resident => resident.user.id))))

    // now let's retrieve already sent messages by users and message type where statement
    // filter out messages old that 2 months
    const sentMessages = await Message.getAll(context, {
        type: METER_VERIFICATION_DATE_REMINDER_TYPE,
        user: {
            id_in: users,
        },
        createdAt_gte: dayjs(date).add(-2, 'month').format('YYYY-MM-DD'),
    })

    // do filter
    return metersConnectedWithResidents
        .map(item => {
            const { meter, residents } = item

            // let's filter residents that already got a notification
            const residentsWithoutNotifications = residents.filter(resident => {
                // if we have at least one message
                // that means we shouldn't send notification again
                const message = sentMessages.find(sentMessage => {
                    // we have to check the following things
                    // 1. Get message for particular resident
                    // 2. Filter out messages related to other meters
                    // 3. Filter out messages sent before current reminder window
                    const messageCreateAt = dayjs(sentMessage.createdAt)
                    const endOfReminderWindow = dayjs(meter.nextVerificationDate)
                    const startOfReminderWindow = endOfReminderWindow.add(-reminderWindowSize, 'day')

                    return sentMessage.user.id === resident.user.id
                        && meter.id === sentMessage.meta.data.meterId
                        && messageCreateAt.unix() >= startOfReminderWindow.unix()
                })
                return message == null
            })

            // create a pair again
            // and filter out meter with empty residents
            return {
                meter,
                residents: residentsWithoutNotifications,
            }
        })
        .filter(item => item.residents.length > 0)
}

const getOrganizationLang = async (context, id) => {
    const organization = await Organization.getOne(context, { id, deletedAt: null })

    /**
     * Detect message language
     * Use DEFAULT_LOCALE if organization.country is unknown
     * (not defined within @condo/domains/common/constants/countries)
     */
    return get(COUNTRIES, get(organization, 'country.locale'), DEFAULT_LOCALE)
}
const generateReminderMessages = async ({ context, reminderWindowSize, reminders }) => {
    const messages = []

    await Promise.all(reminders.map(async (reminder) => {
        const { meter, residents } = reminder
        const lang = await getOrganizationLang(context, meter.organization.id)

        // prepare a message for each resident
        messages.push(
            ...residents.map(resident => ({
                sender: { dv: 1, fingerprint: 'meters-validation-date-cron-push' },
                to: { user: { id: resident.user.id } },
                type: METER_VERIFICATION_DATE_REMINDER_TYPE,
                lang,
                meta: {
                    dv: 1,
                    data: {
                        reminderWindowSize,
                        reminderDate: dayjs(meter.nextVerificationDate).locale(lang).format('D MMM'),
                        meterId: meter.id,
                        userId: resident.user.id,
                        residentId: resident.id,
                    },
                },
            }))
        )
    }))

    return messages
}

const sendReminders = async ({ context, messages }) => {
    await Promise.all(messages.map(async (message) => {
        await sendMessage(context, message)
    }))
}

const sendVerificationDateReminder = async ({ date, searchWindowDaysShift, daysCount }) => {
    // prepare vars
    if (!date) date = dayjs().format('YYYY-MM-DD')
    const reminderWindowSize = searchWindowDaysShift + daysCount

    // initialize context stuff
    const { keystone: context } = await getSchemaCtx('Meter')

    // let's proceed meters page by page
    const messagesQueue = []
    const pageSize = 100
    let offset = 0
    let hasMore = false
    do {
        const meters = await readMetersPage({
            context, offset, pageSize, date, searchWindowDaysShift, daysCount,
        })

        if (meters.length > 0) {
            // connect residents to meter through the property field
            const metersConnectedWithResidents = await getMetersConnectedWithResidents(
                { context, meters }
            )

            if (metersConnectedWithResidents.length > 0) {
                // filter out meters that was already reminded
                const reminders = await filterSentReminders({
                    context, date, reminderWindowSize, metersConnectedWithResidents,
                })

                // generate messages
                const messages = await generateReminderMessages({
                    context, reminderWindowSize, reminders,
                })

                // push to queue only unique messages
                messages.forEach(message => {
                    const queuedMessage = messagesQueue.find(queued =>
                        queued.to.user.id === message.to.user.id
                        && queued.meta.data.meterId === message.meta.data.meterId
                        && queued.meta.data.reminderDate === message.reminderDate
                    )

                    if (queuedMessage == null) {
                        messagesQueue.push(message)
                    }
                })
            }
        }

        // check if we have more pages
        hasMore = meters.length > 0
        offset += pageSize
    } while (hasMore)

    // send reminders
    await sendReminders({ context, messages: messagesQueue })
}

module.exports = {
    sendVerificationDateReminder,
}
