const Big = require('big.js')
const dayjs = require('dayjs')
const get = require('lodash/get')
const sortBy = require('lodash/sortBy')

const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    BILLING_CYCLE_ANNUAL,
    DEFAULT_RENT_CHARGE_CURRENCY_CODE,
    PARTIAL_MONTH_RULE_FULL,
    PARTIAL_MONTH_RULE_NONE,
    PARTIAL_MONTH_RULE_PRORATE_BY_DAYS,
    RENT_CHARGE_STATUS_DRAFT,
    RENT_CHARGE_STATUS_INVOICED,
} = require('@condo/domains/billing/constants/rent')
const { INVOICE_STATUS_DRAFT } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { BILLING_FREQUENCY_ANNUAL } = require('@condo/domains/resident/constants/occupancy')
const { findActiveOccupancies } = require('@condo/domains/resident/utils/serverSchema')

const TASK_SENDER = { dv: 1, fingerprint: 'generateRentChargesTask' }
const RentCharge = generateServerUtils('RentCharge')

function toCalendarDay (date) {
    return dayjs(date).format('YYYY-MM-DD')
}

function getMonthStart (date) {
    return toCalendarDay(dayjs(date).startOf('month'))
}

function getMonthEnd (date) {
    return toCalendarDay(dayjs(date).endOf('month'))
}

function getDueDate (billingMonth, dueDay) {
    const monthStart = dayjs(billingMonth).startOf('month')
    const day = Math.max(1, Number(dueDay) || 1)
    const clampedDay = Math.min(day, monthStart.daysInMonth())

    return toCalendarDay(monthStart.date(clampedDay))
}

function isPartialMonth (occupancy, periodStart, periodEnd) {
    return get(occupancy, 'startDate') > periodStart ||
        (!!get(occupancy, 'expectedEndDate') && get(occupancy, 'expectedEndDate') < periodEnd) ||
        (!!get(occupancy, 'actualEndDate') && get(occupancy, 'actualEndDate') < periodEnd)
}

function calculateRentChargeAmount (occupancy, policy, periodStart, periodEnd) {
    const monthlyRate = Big(get(occupancy, 'monthlyRate') || 0)
    const partialMonthRule = get(policy, 'partialMonthRule') || PARTIAL_MONTH_RULE_FULL

    if (!isPartialMonth(occupancy, periodStart, periodEnd)) {
        return monthlyRate.toString()
    }

    if (partialMonthRule === PARTIAL_MONTH_RULE_NONE) {
        return null
    }

    if (partialMonthRule === PARTIAL_MONTH_RULE_PRORATE_BY_DAYS) {
        const occupiedStart = dayjs.max
            ? dayjs.max(dayjs(periodStart), dayjs(get(occupancy, 'startDate')))
            : (dayjs(get(occupancy, 'startDate')).isAfter(periodStart) ? dayjs(get(occupancy, 'startDate')) : dayjs(periodStart))
        const occupancyEnd = get(occupancy, 'actualEndDate') || get(occupancy, 'expectedEndDate') || periodEnd
        const occupiedEnd = dayjs(occupancyEnd).isBefore(periodEnd) ? dayjs(occupancyEnd) : dayjs(periodEnd)
        const occupiedDays = Math.max(0, occupiedEnd.diff(occupiedStart, 'day') + 1)
        const monthDays = dayjs(periodStart).daysInMonth()

        return monthlyRate.mul(occupiedDays).div(monthDays).toFixed(8)
    }

    return monthlyRate.toString()
}

function buildRentChargeInvoiceRow (rentCharge) {
    return {
        name: `Rent ${rentCharge.billingMonth}`,
        toPay: rentCharge.amount,
        count: 1,
    }
}

async function getBillingPolicyForOccupancy (occupancy) {
    const [policy] = await find('BillingPolicy', {
        property: { id: occupancy.property },
        deletedAt: null,
    })

    return policy || {
        billingCycle: get(occupancy, 'billingFrequency'),
        dueDay: 1,
        partialMonthRule: PARTIAL_MONTH_RULE_FULL,
    }
}

function buildPeriodData (occupancy, policy, billingMonth) {
    const periodStart = getMonthStart(billingMonth)
    const periodEnd = getMonthEnd(billingMonth)
    const amount = calculateRentChargeAmount(occupancy, policy, periodStart, periodEnd)

    if (amount === null) return null

    return {
        billingMonth,
        periodStart,
        periodEnd,
        dueDate: getDueDate(billingMonth, get(policy, 'dueDay')),
        amount,
        currencyCode: DEFAULT_RENT_CHARGE_CURRENCY_CODE,
    }
}

async function createRentChargeIfMissing (context, occupancy, periodData, sender = TASK_SENDER) {
    const [existingCharge] = await find('RentCharge', {
        occupancy: { id: occupancy.id },
        billingMonth: periodData.billingMonth,
        deletedAt: null,
    })

    if (existingCharge) {
        return { rentCharge: existingCharge, created: false }
    }

    try {
        const rentCharge = await RentCharge.create(context, {
            dv: 1,
            sender,
            occupancy: { connect: { id: occupancy.id } },
            organization: { connect: { id: occupancy.organization } },
            property: { connect: { id: occupancy.property } },
            rentalUnit: { connect: { id: occupancy.rentalUnit } },
            ...periodData,
        })

        return { rentCharge, created: true }
    } catch (err) {
        if (String(err.message).includes('rent_charge_unique_occupancy_billing_month')) {
            const [rentCharge] = await find('RentCharge', {
                occupancy: { id: occupancy.id },
                billingMonth: periodData.billingMonth,
                deletedAt: null,
            })

            return { rentCharge, created: false }
        }

        throw err
    }
}

function getBillingMonthsToGenerate (occupancy, policy, cutoffDate, options = {}) {
    const months = []
    let cursor = dayjs(getMonthStart(get(occupancy, 'startDate')))
    const cutoffMonth = dayjs(getMonthStart(cutoffDate))

    while (cursor.isSame(cutoffMonth) || cursor.isBefore(cutoffMonth)) {
        const billingMonth = toCalendarDay(cursor)
        const dueDate = getDueDate(billingMonth, get(policy, 'dueDay'))

        if (dueDate <= cutoffDate || (options.includeCutoffMonth && cursor.isSame(cutoffMonth))) {
            months.push(billingMonth)
        }

        cursor = cursor.add(1, 'month')
    }

    return months
}

function isAnnualBilling (occupancy, policy) {
    return get(occupancy, 'billingFrequency') === BILLING_FREQUENCY_ANNUAL ||
        get(policy, 'billingCycle') === BILLING_CYCLE_ANNUAL
}

async function createGroupedAnnualInvoice (context, occupancy, charges, sender = TASK_SENDER) {
    const invoiceCharges = sortBy(charges, ['billingMonth'])
        .filter(charge => (
            charge &&
            !charge.invoice &&
            charge.status === RENT_CHARGE_STATUS_DRAFT
        ))

    if (invoiceCharges.length === 0) return null

    const invoice = await Invoice.create(context, {
        dv: 1,
        sender,
        organization: { connect: { id: occupancy.organization } },
        property: { connect: { id: occupancy.property } },
        rentalUnit: { connect: { id: occupancy.rentalUnit } },
        status: INVOICE_STATUS_DRAFT,
        rows: invoiceCharges.map(buildRentChargeInvoiceRow),
    })

    for (const charge of invoiceCharges) {
        await RentCharge.update(context, charge.id, {
            dv: 1,
            sender,
            invoice: { connect: { id: invoice.id } },
            status: RENT_CHARGE_STATUS_INVOICED,
        })
    }

    return invoice
}

async function generateRentChargesForOccupancy (context, occupancy, options = {}) {
    const cutoffDate = options.cutoffDate || toCalendarDay(new Date())
    const sender = options.sender || TASK_SENDER
    const policy = await getBillingPolicyForOccupancy(occupancy)
    const billingMonths = getBillingMonthsToGenerate(occupancy, policy, cutoffDate, {
        includeCutoffMonth: options.includeCutoffMonth,
    })
    const rentCharges = []
    let createdCount = 0

    for (const billingMonth of billingMonths) {
        const periodData = buildPeriodData(occupancy, policy, billingMonth)

        if (!periodData) continue

        const { rentCharge, created } = await createRentChargeIfMissing(context, occupancy, periodData, sender)
        if (rentCharge) rentCharges.push(rentCharge)
        if (created) createdCount++
    }

    let invoice = null
    if (isAnnualBilling(occupancy, policy)) {
        const dueUninvoicedCharges = await find('RentCharge', {
            occupancy: { id: occupancy.id },
            invoice_is_null: true,
            status: RENT_CHARGE_STATUS_DRAFT,
            dueDate_lte: cutoffDate,
            deletedAt: null,
        })

        invoice = await createGroupedAnnualInvoice(context, occupancy, dueUninvoicedCharges, sender)
    }

    return {
        occupancy,
        policy,
        rentCharges,
        invoice,
        createdCount,
    }
}

async function generateRentCharges (options = {}) {
    const { keystone: defaultContext } = getSchemaCtx('RentCharge')
    const context = options.context || defaultContext
    const cutoffDate = options.cutoffDate || toCalendarDay(new Date())
    const sender = options.sender || TASK_SENDER
    const occupancies = options.occupancies || await findActiveOccupancies({ today: cutoffDate })
    const results = []

    for (const occupancy of occupancies) {
        results.push(await generateRentChargesForOccupancy(context, occupancy, { cutoffDate, sender }))
    }

    return {
        processedOccupancies: occupancies.length,
        createdCharges: results.reduce((total, result) => total + result.createdCount, 0),
        createdInvoices: results.filter(result => result.invoice).length,
        results,
    }
}

module.exports = {
    TASK_SENDER,
    buildPeriodData,
    buildRentChargeInvoiceRow,
    calculateRentChargeAmount,
    createGroupedAnnualInvoice,
    generateRentCharges,
    generateRentChargesForOccupancy,
    getBillingMonthsToGenerate,
    getDueDate,
}
