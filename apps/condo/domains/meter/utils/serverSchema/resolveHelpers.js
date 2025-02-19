const dayjs = require('dayjs')
const get = require('lodash/get')

const { getOrCreateContactByClientData } = require('@condo/domains/ticket/utils/serverSchema/resolveHelpers')

function addClientInfoToResidentMeterReading (context, resolvedData) {
    const user = get(context, ['req', 'user'])

    resolvedData.client = user.id
    resolvedData.clientName = user.name
    resolvedData.clientPhone = user.phone
    resolvedData.clientEmail = user.email
}

async function connectContactToMeterReading (context, resolvedData, existingItem) {
    let contactId = get(resolvedData, 'contact', null)

    if (!contactId) {
        const contact = await getOrCreateContactByClientData(context, resolvedData, existingItem)
        contactId = contact.id
    }

    return contactId
}

/**
 * If restrictionEnd is bigger than the number of days in the month, then return the last day of month, else return restrictionEnd
 * @param restrictionEndDay
 * @param lastDayOfMonth
 * @returns {number}
 */
function getAdjustedRestrictionEnd (restrictionEndDay, lastDayOfMonth) {
    return Math.min(restrictionEndDay, lastDayOfMonth)
}

function isReadingDateAllowed (date, meterReportingPeriod) {
    const readingDate = dayjs(date)
    const { notifyStartDay, notifyEndDay, restrictionEndDay, isStrict } = meterReportingPeriod

    // NOTE: if period is not strict, skip checks
    if (!isStrict) return true

    // NOTE: If restrictionEnd falls within the notify period, ignore restriction
    const isRestrictionWithinAllowedPeriod = notifyStartDay < notifyEndDay
        ? notifyStartDay <= restrictionEndDay && restrictionEndDay <= notifyEndDay
        : restrictionEndDay >= notifyStartDay || restrictionEndDay <= notifyEndDay

    if (isRestrictionWithinAllowedPeriod) return true

    // NOTE: restricted period can span two months, so we need to check both current and previous month
    const monthStart = readingDate.startOf('month')
    const prevMonthStart = monthStart.subtract(1, 'month')

    const adjustedRestrictionEnd = getAdjustedRestrictionEnd(restrictionEndDay, readingDate.endOf('month').date())
    const adjustedPrevRestrictionEnd = getAdjustedRestrictionEnd(restrictionEndDay, prevMonthStart.endOf('month').date())

    const getPeriodEnd = (monthStart, notifyEnd) => monthStart.date(notifyEnd)
    const getRestrictionEnd = (monthStart, notifyEnd, restrictionEnd) =>
        restrictionEndDay < notifyEnd
            ? getPeriodEnd(monthStart, notifyEnd).add(1, 'month').date(restrictionEnd)
            : monthStart.date(restrictionEnd)

    const periodEnd = getPeriodEnd(monthStart, notifyEndDay)
    const prevPeriodEnd = getPeriodEnd(prevMonthStart, notifyEndDay)
    const restrictionEnd = getRestrictionEnd(monthStart, notifyEndDay, adjustedRestrictionEnd)
    const prevRestrictionEnd = getRestrictionEnd(prevMonthStart, notifyEndDay, adjustedPrevRestrictionEnd)

    return !(readingDate.isAfter(periodEnd, 'day') && !readingDate.isAfter(restrictionEnd, 'day') ||
        readingDate.isAfter(prevPeriodEnd, 'day') && !readingDate.isAfter(prevRestrictionEnd, 'day'))
}

module.exports = {
    addClientInfoToResidentMeterReading,
    connectContactToMeterReading,
    isReadingDateAllowed,
}