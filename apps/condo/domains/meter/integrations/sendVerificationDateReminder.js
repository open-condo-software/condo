const dayjs = require('dayjs')
const { getSchemaCtx } = require('@core/keystone/schema')
const { Meter } = require('@condo/domains/meter/utils/serverSchema')
const { sendMessage, Message } = require('@condo/domains/notification/utils/serverSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')
const { get, flatten, uniq } = require('lodash')
const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')

const readMeters = async (context, date, searchWindowDaysShift, daysCount) => {
    // calc window
    const startWindowDate = dayjs(date).add(searchWindowDaysShift, 'day').format('YYYY-MM-DD')
    const endWindowDate = dayjs(date)
        .add(searchWindowDaysShift + daysCount + 1, 'day')
        .format('YYYY-MM-DD')

    return await Meter.getAll(context, {
        nextVerificationDate_gte: startWindowDate,
        nextVerificationDate_lte: endWindowDate,
    })
}

const connectResidents = async (context, meters) => {
    // first step is to get all properties
    const properties = uniq(meters.map(meter => meter.property.id))

    // now let's get residents for the list of properties
    const residents = await Resident.getAll(context, {
        property: {
            id_in: properties,
        },
    })

    // next step - connect residents to meter using the property as a connection
    return meters.map(meter => ({
        meter,
        residents: residents.filter(resident => resident.property.id === meter.property.id),
    }))
}

const filterSentReminders = async (context, reminderType, reminderWindowSize, remindersPairs) => {
    // let's get all user in those reminders
    const users = uniq(flatten(remindersPairs.map(pair => pair.residents.map(resident => resident.user.id))))

    // now let's retrieve already sent messages by users and reminderType where statement
    // filter out messages old that 2 months
    const sentMessages = await Message.getAll(context, {
        type: reminderType,
        user: {
            id_in: users,
        },
        createdAt_gte: dayjs().add(-2, 'month').format('YYYY-MM-DD'),
    })

    // do filter
    return remindersPairs
        .map(pair => {
            const { meter, residents } = pair

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
                        && sentMessage.meta.data.meterId === meter.id
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
        .filter(pair => pair.residents.length > 0)
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

const sendReminders = async (context, reminderType, reminderWindowSize, reminders) => {
    await Promise.all(reminders.map(async (reminder) => {
        const { meter, residents } = reminder
        const lang = await getOrganizationLang(context, meter.organization.id)

        // send a message for each resident
        await Promise.all(residents.map(async (resident) => {
            // prepare a message content
            const data = {
                sender: { dv: 1, fingerprint: 'cron-push' },
                to: { user: { id: resident.user.id } },
                type: reminderType,
                lang,
                meta: {
                    dv: 1,
                    data: {
                        reminderWindowSize,
                        reminderDate: dayjs(meter.nextVerificationDate).locale(lang).format('D MMM'),
                        meterId: meter.id,
                    },
                },
            }
            await sendMessage(context, data)
        }))
    }))
}

const sendVerificationDateReminder = async (date, reminderType, searchWindowDaysShift, daysCount) => {
    // prepare vars
    if (!date) date = dayjs().format('YYYY-MM-DD')
    const reminderWindowSize = searchWindowDaysShift + daysCount

    // initialize context stuff
    const { keystone } = await getSchemaCtx('Meter')
    const context = await keystone.createContext({ skipAccessControl: true })

    // retrieve meters inside requested window
    const meters = await readMeters(context, date, searchWindowDaysShift, daysCount)

    // connect residents to meter through the property field
    const remindersPairs = await connectResidents(context, meters)

    // filter out meters that was already reminded
    const reminders = await filterSentReminders(context, reminderType, reminderWindowSize, remindersPairs)

    // send reminders
    await sendReminders(context, reminderType, reminderWindowSize, reminders)
}

module.exports = {
    sendVerificationDateReminder,
}
