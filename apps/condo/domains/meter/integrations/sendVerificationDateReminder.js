const dayjs = require('dayjs')
const { getSchemaCtx } = require('@core/keystone/schema')
const { Meter } = require('@condo/domains/meter/utils/serverSchema')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

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

const filterSendReminders = async (context, meters) => {
    return meters // TODO make a filter here
}

const sendReminders = async (context, reminderType, meters) => {
    await Promise.all(meters.map(async (meter) => {
        // prepare a message content
        const data = {
            sender: meter.sender, // TODO get the proper sender here
            to: { phone: '+79829276444' }, // TODO get proper destination for notifications
            type: reminderType,
            lang: 'ru', // TODO get proper lang
            meta: {
                dv: 1,
                data: {
                    reminderDate: dayjs(meter.nextVerificationDate).format('YYYY-MM-DD'),
                    meterId: meter.id,
                },
            },
        }
        await sendMessage(context, data)
    }))
}

const sendVerificationDateReminder = async (date, reminderType, searchWindowDaysShift, daysCount) => {
    // normalize date
    if (!date) date = dayjs().format('YYYY-MM-DD')

    // initialize context stuff
    const { keystone } = await getSchemaCtx('Meter')
    const context = await keystone.createContext({ skipAccessControl: true })

    // retrieve meters inside requested window
    const meters = await readMeters(context, date, searchWindowDaysShift, daysCount)

    // filter out meters that was already reminded
    const reminderSubjects = await filterSendReminders(context, meters)

    // send reminders
    await sendReminders(context, reminderType, reminderSubjects)
}

module.exports = {
    sendVerificationDateReminder,
}
