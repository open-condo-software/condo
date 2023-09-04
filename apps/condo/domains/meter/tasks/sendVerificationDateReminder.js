const dayjs = require('dayjs')
const { get, flatten, uniq } = require('lodash')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { getLocalized } = require('@open-condo/locales/loader')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { Meter } = require('@condo/domains/meter/utils/serverSchema')
const { METER_VERIFICATION_DATE_REMINDER_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage, Message } = require('@condo/domains/notification/utils/serverSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { Resident, ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')

const rightJoin = (heads, edges, joinFn, selectFn) => {
    return heads.map(head => {
        return selectFn(head, edges.filter(edge => joinFn(head, edge)))
    })
}

const readMetersPage = async ({ context, offset, pageSize, date, searchWindowDaysShift, daysCount }) => {
    // calc window
    const startWindowDate = dayjs(date).add(searchWindowDaysShift, 'day').format('YYYY-MM-DD')
    const endWindowDate = dayjs(date)
        .add(searchWindowDaysShift + daysCount + 1, 'day')
        .format('YYYY-MM-DD')

    const metersToCheck = await Meter.getAll(
        context, {
            nextVerificationDate_gte: startWindowDate,
            nextVerificationDate_lte: endWindowDate,
            isAutomatic: false,
        }, {
            sortBy: 'id_ASC',
            first: pageSize,
            skip: offset,
        }
    )

    // remove meters with wrong nextVerificationDate
    const meters = metersToCheck.filter(({ verificationDate, nextVerificationDate }) => {
        return nextVerificationDate && verificationDate && dayjs(nextVerificationDate).diff(verificationDate, 'month') > 1
    })

    return {
        meters,
        count: metersToCheck.length,
    }
}

const joinResidentsToMeters = async ({ context, meters }) => {
    // first step is get service consumers by accountNumbers
    const accountNumbers = uniq(meters.map(meter => meter.accountNumber))
    const servicesConsumers = await loadListByChunks({
        context,
        list: ServiceConsumer,
        where: {
            accountNumber_in: accountNumbers,
            deletedAt: null,
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
            deletedAt: null,
        },
    })

    // next step - connect residents to services consumers
    const servicesConsumerWithConnectedResidents = rightJoin(
        servicesConsumers,
        residents,
        (servicesConsumer, resident) => resident.id === servicesConsumer.resident.id,
        (servicesConsumer, residents) => ({ servicesConsumer, residents })
    )

    // next step - connect meters to residents using previously created connection
    const metersWithServiceConsumers = rightJoin(
        meters,
        servicesConsumerWithConnectedResidents,
        (meter, item) => (
            item.servicesConsumer.accountNumber === meter.accountNumber &&
            item.servicesConsumer.organization.id === meter.organization.id
        ),
        (meter, servicesConsumers) => ({ meter, servicesConsumers })
    )
        .filter(item => item.servicesConsumers != null && item.servicesConsumers.length > 0)
    console.log('joinResidentsToMeters', {
        metersWithServiceConsumers,
    })
    return metersWithServiceConsumers
        .map(meterWithServiceConsumers => {
            const { meter, servicesConsumers } = meterWithServiceConsumers

            const residents = flatten(servicesConsumers.map(item => item.residents))
                .filter(resident =>
                    // TODO introduce unitType check once it appears on the production DB
                    resident.unitName === meter.unitName
                )

            return {
                meter,
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
    const sentMessages = await loadListByChunks({
        context,
        list: Message,
        where: {
            type: METER_VERIFICATION_DATE_REMINDER_TYPE,
            user: {
                id_in: users,
            },
            createdAt_gte: dayjs(date).add(-2, 'month').format('YYYY-MM-DD'),
            deletedAt: null,
        },
    })

    // do filter
    return metersConnectedWithResidents
        .map(item => {
            const { meter, residents } = item

            const residentsWithoutNotifications = rightJoin(
                residents,
                sentMessages,
                (resident, sentMessage) => {
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
                },
                (resident, messages) => ({
                    resident,
                    message: messages.length > 0 ? messages[0] : null,
                }),
            )
                // let's filter residents that already got a notification
                .filter(residentWithMessage => residentWithMessage.message == null)
                // remap to have resident object at the root level
                .map(residentWithMessage => residentWithMessage.resident)

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
    return get(COUNTRIES, [get(organization, 'country', conf.DEFAULT_LOCALE), 'locale'], conf.DEFAULT_LOCALE)
}

// TODO(ekabardinsky): not tested. :(
const generateReminderMessages = async ({ context, reminders }) => {
    const messages = []
    await Promise.all(reminders.map(async (reminder) => {
        const { meter, residents } = reminder
        const lang = await getOrganizationLang(context, meter.organization.id)

        // prepare a message for each resident
        messages.push(
            ...residents.map(resident => {
                const resourceNonLocalizedName = get(meter, 'resource.nameNonLocalized', '')
                const localizedResourceName = getLocalized(lang, resourceNonLocalizedName)

                return {
                    sender: { dv: 1, fingerprint: 'meters-validation-date-cron-push' },
                    to: { user: { id: resident.user.id } },
                    type: METER_VERIFICATION_DATE_REMINDER_TYPE,
                    lang,
                    meta: {
                        dv: 1,
                        data: {
                            reminderDate: dayjs(meter.nextVerificationDate).locale(lang).format('D MMM'),
                            meterId: meter.id,
                            resource: { name: localizedResourceName },
                            userId: resident.user.id,
                            residentId: resident.id,
                            url: `${ conf.SERVER_URL }/meter/`,
                        },
                    },
                    organization: { id: meter.organization.id },
                }
            })
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
    const pageSize = 100
    let offset = 0
    let hasMore = false
    do {
        const { meters, count } = await readMetersPage({
            context, offset, pageSize, date, searchWindowDaysShift, daysCount,
        })

        if (meters.length > 0) {
            // connect residents to meter through the property field
            const metersConnectedWithResidents = await joinResidentsToMeters(
                { context, meters }
            )

            // filter out meters that was already reminded
            const reminders = await filterSentReminders({
                context, date, reminderWindowSize, metersConnectedWithResidents,
            })

            // generate messages
            const messages = await generateReminderMessages({ context, reminders })

            // send reminders
            await sendReminders({ context, messages })
        }

        // check if we have more pages
        hasMore = count > 0
        offset += pageSize
    } while (hasMore)
}

module.exports = {
    sendVerificationDateReminder,
    rightJoin,
    joinResidentsToMeters,
}
