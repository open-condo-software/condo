const dayjs = require('dayjs')
const isBetween = require('dayjs/plugin/isBetween')
const { get, uniq, isNull, isEmpty, isNil } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { getLocalized } = require('@open-condo/locales/loader')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { RU_LOCALE } = require('@condo/domains/common/constants/locale')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { rightJoin, joinResidentsToMeters } = require('@condo/domains/meter/tasks/sendVerificationDateReminder')
const { Meter, MeterReading, MeterReportingPeriod } = require('@condo/domains/meter/utils/serverSchema')
const {
    METER_VERIFICATION_DATE_EXPIRED_TYPE, METER_SUBMIT_READINGS_REMINDER_END_PERIOD_TYPE, METER_SUBMIT_READINGS_REMINDER_START_PERIOD_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')


dayjs.extend(isBetween)
const logger = getLogger()

const readMetersPage = async ({ context, offset, pageSize }) => {
    return await Meter.getAll(context, {
        isAutomatic: false,
        deletedAt: null,
        organization: {
            deletedAt: null,
        },
        property: {
            deletedAt: null,
        },
    },
    'id property { id } unitName unitType organization { id } ' +
        'accountNumber nextVerificationDate resource { nameNonLocalized }',
    {
        sortBy: 'id_ASC',
        first: pageSize,
        skip: offset,
    })
}

const readMeterReadings = async ({ context, meters }) => {
    // first step is get unique meter ids
    const meterIds = uniq(meters.map(meter => meter.id))

    // then calculate current period window
    const now = dayjs()
    const startWindowDate = `${now.format('YYYY-MM')}-01`
    const endWindowDate = now.endOf('day').toISOString()

    // load all pages for entity
    return await loadListByChunks({
        context,
        chunkSize: 50,
        list: MeterReading,
        where: {
            date_gte: startWindowDate,
            date_lte: endWindowDate,
            meter: {
                id_in: meterIds,
                deletedAt: null,
            },
            deletedAt: null,
        },
        fields: 'date meter { id }',
    })
}

const readOrganizations = async ({ context, meters }) => {
    // first step is get unique organizations ids
    const organizationIds = uniq(meters.map(meter => meter.organization.id))

    // load all pages for entity
    return await loadListByChunks({
        context,
        list: Organization,
        where: {
            id_in: organizationIds,
            deletedAt: null,
        },
        fields: 'id country',
    })
}

const readMeterReportingPeriods = async ({ context, organizations }) => {
    const organizationIds = organizations.map(org => org.id)
    return await loadListByChunks({
        context,
        list: MeterReportingPeriod,
        where: {
            organization: {
                id_in: organizationIds,
            },
            deletedAt: null,
        },
        fields: 'organization { id } property { id } notifyStartDay notifyEndDay',
    })
}

const checkIsDateStartOrEndOfPeriod = (date, today, start, end) => (
    dayjs(date).isSame(dayjs(today).set('date', start), 'day') ||
    dayjs(date).isSame(dayjs(today).set('date', end), 'day')
)

const createEndDate = (date, notifyStartDay, notifyEndDay) => {
    let currentDate = dayjs(date.startTime).set('date', notifyEndDay)
    while (date.get('month') < currentDate.get('month')) {
        currentDate = currentDate.subtract(1, 'd')
    }
    if (notifyStartDay > notifyEndDay) {
        currentDate = currentDate.add(1, 'M')
    }
    return currentDate.format('YYYY-MM-DD')
}

const sendSubmitMeterReadingsPushNotifications = async () => {
    // task implementation algorithm
    // * Read all meter resources for all supported languages
    // * Read meters page
    // * Read meter readings (from 01 day of month to now) for meters above
    // * Read meter organisation for meters above
    // * Right join readings/organisation/resources to meters
    // * Filter meters without readings
    // * Filter meters without organisation default period
    // * Join residents to rest of meters
    // * Send message with specific unique key for set up readings (key is: {meterId}_{residentId}_{now().minusMonth().format(YYYY_MM)})
    // * Filter meters with expired next verification date
    // * Send message with specific unique key for expired verification (key is: {meterId}_{residentId}_{now().minusMonth().format(YYYY_MM)})
    // * Print some stat

    logger.info('Start sending submit meter notifications')
    // initialize context stuff
    const { keystone: context } = getSchemaCtx('Meter')

    // let's load meters page by page
    const state = {
        pageSize: 100,
        offset: 0,
        hasMore: true,
        processedMeters: 0,
        processedPages: 0,
        metersWithoutReadings: 0,
        metersWithoutReadingsAndWithResidents: 0,
        metersWithExpiredVerificationDate: 0,
        startTime: dayjs(),
    }
    logger.info({ msg: 'start proceeding', data: { state } })

    do {
        // log each 10 pages
        if (state.processedPages % 10 === 0) {
            logger.info({ msg: 'processing', data: { state } })
        }

        // read all required data
        const meters = await readMetersPage({
            context,
            offset: state.offset,
            pageSize: state.pageSize,
        })
        const organizations = await readOrganizations({ context, meters })
        const reportingPeriods = await readMeterReportingPeriods({ context, organizations })
        const meterReadings = await readMeterReadings({ context, meters })

        const metersWithoutReadings = []
        const periodsByProperty = []
        const periodsByOrganization = []
        let defaultPeriod = null

        for (let period of reportingPeriods) {
            if (isNil(period.organization) && isNil(period.property)) defaultPeriod = period
            else if (!isNil(period.organization) && isNil(period.property)) periodsByOrganization.push(period)
            else periodsByProperty.push(period)
        }

        for (const meter of meters) {
            const period = periodsByProperty.find(({ property }) => property.id === meter.property.id) ??
                periodsByOrganization.find(({ organization }) => organization.id === meter.organization.id) ??
                defaultPeriod

            if (isNil(period)) continue

            const notifyStartDay = get(period, 'notifyStartDay')
            const notifyEndDay = get(period, 'notifyEndDay')
            const notifyStartDate = dayjs(state.startTime).set('date', notifyStartDay).format('YYYY-MM-DD')
            const notifyEndDate = createEndDate(state.startTime, notifyStartDay, notifyEndDay)

            const readingsOfCurrentMeter = meterReadings.filter(reading => (
                reading.meter.id === meter.id &&
                dayjs(reading.date).isBetween(notifyStartDate, notifyEndDate, 'day', '[]')
            ))

            const isTodayStartOrEndOfPeriod = checkIsDateStartOrEndOfPeriod(state.startTime, state.startTime, notifyStartDay, notifyEndDay)
            const isEndPeriodNotification = dayjs(state.startTime).format('YYYY-MM-DD') === dayjs(state.startTime).set('date', notifyEndDay).format('YYYY-MM-DD')
            const startPeriodKey = dayjs(state.startTime).set('date', notifyStartDay).format('YYYY-MM-DD')
            const endPeriodKey = dayjs(state.startTime).set('date', notifyEndDay).format('YYYY-MM-DD')
            const periodKey = isEndPeriodNotification ? endPeriodKey : startPeriodKey

            if (isTodayStartOrEndOfPeriod && isEmpty(readingsOfCurrentMeter)) metersWithoutReadings.push({ meter, periodKey, isEndPeriodNotification })
        }

        // right join organizations
        const metersToSendNotification = rightJoin(
            metersWithoutReadings,
            organizations,
            ({ meter }, organization) => meter.organization.id === organization.id,
            ({ meter, isEndPeriodNotification, periodKey }, organization) => {
                /**
                 * Detect message language
                 * Use DEFAULT_LOCALE if organization.country is unknown
                 * (not defined within @condo/domains/common/constants/countries)
                 */
                const lang = get(COUNTRIES, [get(organization, 'country', conf.DEFAULT_LOCALE), 'locale'], conf.DEFAULT_LOCALE)
                return { ...meter, isEndPeriodNotification, periodKey, lang }
            }
        )
        state.metersWithoutReadings += metersToSendNotification.length

        // Join residents
        const metersWithResident = await joinResidentsToMeters({ context, meters: metersToSendNotification })
        state.metersWithoutReadingsAndWithResidents += metersWithResident.length

        // Send message with specific unique key for set up readings
        await sendMessagesForSetUpReadings({
            context, metersWithResident,
        })

        // Filter meters with expired next verification date
        const expiredVerificationMetersWithResident = metersWithResident
            .filter(({ meter }) => {
                if (isNull(meter.nextVerificationDate)) return false

                return dayjs().unix() >= dayjs(meter.nextVerificationDate).unix()
            })
        state.metersWithExpiredVerificationDate += expiredVerificationMetersWithResident.length

        // Send message with specific unique key for expired verification
        await sendMessagesForExpiredMeterVerificationDate({
            context, metersWithResident: expiredVerificationMetersWithResident,
        })

        // check if we have more pages
        state.hasMore = meters.length > 0
        state.processedMeters += meters.length
        state.offset += state.pageSize
        state.processedPages++
    } while (state.hasMore)

    // some stat
    const endTime = dayjs()
    logger.info({
        msg: 'end proceeding',
        processingTime: endTime.unix() - state.startTime.unix(),
        data: {
            endTime,
            state,
        },
    })
}

const sendMessageSafely = async ({ context, message }) => {
    try {
        await sendMessage(context, message)
    } catch (err) {
        logger.error({ msg: 'sendMessage error', err })
    }
}

const sendMessagesForSetUpReadings = async ({ context, metersWithResident }) => {
    await Promise.all(metersWithResident.map(async ({ meter, residents }) => {
        await Promise.all(residents.map(async (resident) => {
            const { lang, periodKey } = meter
            const now = dayjs()
            const uniqKey = `${resident.user.id}_${periodKey}_${meter.isEndPeriodNotification ? 'end' : 'start'}`

            const message = {
                sender: { dv: 1, fingerprint: 'meters-readings-submit-reminder-cron-push' },
                to: { user: { id: resident.user.id } },
                type: meter.isEndPeriodNotification ? METER_SUBMIT_READINGS_REMINDER_END_PERIOD_TYPE : METER_SUBMIT_READINGS_REMINDER_START_PERIOD_TYPE,
                lang,
                uniqKey,
                meta: {
                    dv: 1,
                    data: {
                        monthName: lang === RU_LOCALE ? now.locale('ru').format('MMMM') : now.format('MMMM'),
                        meterId: meter.id,
                        userId: resident.user.id,
                        residentId: resident.id,
                        url: `${conf.SERVER_URL}/meter/`,
                    },
                },
                organization: { id: meter.organization.id },
            }

            await sendMessageSafely({ context, message })
        }))
    }))
}

const sendMessagesForExpiredMeterVerificationDate = async ({ context, metersWithResident }) => {
    await Promise.all(metersWithResident.map(async ({ meter, residents }) => {
        await Promise.all(residents.map(async (resident) => {
            const { lang } = meter
            const uniqKey = `${meter.id}_${resident.id}_${dayjs().format('YYYY-MM')}`
            const resourceNonLocalizedName = get(meter, 'resource.nameNonLocalized', '')
            const localizedResourceName = getLocalized(lang, resourceNonLocalizedName)

            const message = {
                sender: { dv: 1, fingerprint: 'meters-readings-submit-reminder-cron-push' },
                to: { user: { id: resident.user.id } },
                type: METER_VERIFICATION_DATE_EXPIRED_TYPE,
                lang,
                uniqKey,
                meta: {
                    dv: 1,
                    data: {
                        meterId: meter.id,
                        resource: { name: localizedResourceName },
                        userId: resident.user.id,
                        residentId: resident.id,
                        url: `${conf.SERVER_URL}/meter/`,
                    },
                },
                organization: meter.organization && { id: meter.organization.id },
            }

            await sendMessageSafely({ context, message })
        }))
    }))
}

module.exports = {
    sendSubmitMeterReadingsPushNotifications,
}
