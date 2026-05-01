const dayjs = require('dayjs')
const get = require('lodash/get')

const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT, NOT_FOUND } } = require('@open-condo/keystone/errors')
const { find, getById } = require('@open-condo/keystone/schema')

const { calculateOccupancyArrears } = require('@condo/domains/billing/utils/serverSchema/arrears')
const { generateRentChargesForOccupancy } = require('@condo/domains/billing/utils/serverSchema/rentChargeGeneration')
const {
    BILLING_FREQUENCY_MONTHLY,
    OCCUPANCY_STATUS_ACTIVE,
    OCCUPANCY_STATUS_CANCELED,
    OCCUPANCY_STATUS_ENDED,
    OCCUPANCY_STATUS_PLANNED,
} = require('@condo/domains/resident/constants/occupancy')
const { findActiveOccupancies } = require('@condo/domains/resident/utils/serverSchema/activeOccupancy')

const Occupancy = generateServerUtils('Occupancy')

const ERRORS = {
    OCCUPANCY_NOT_FOUND: {
        code: NOT_FOUND,
        type: 'OCCUPANCY_NOT_FOUND',
        message: 'Occupancy not found',
        messageForUser: 'api.resident.occupancyLifecycle.OCCUPANCY_NOT_FOUND',
    },
    TENANT_REQUIRED: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_TENANT_REQUIRED',
        message: 'Tenant is required',
        messageForUser: 'api.resident.occupancyLifecycle.TENANT_REQUIRED',
    },
    RENTAL_UNIT_NOT_FOUND: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_RENTAL_UNIT_NOT_FOUND',
        message: 'Rental unit not found',
        messageForUser: 'api.resident.occupancyLifecycle.RENTAL_UNIT_NOT_FOUND',
    },
    UNIT_REQUIRED: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_UNIT_REQUIRED',
        message: 'Occupancy must be linked to a rentable rental unit',
        messageForUser: 'api.resident.occupancyLifecycle.UNIT_REQUIRED',
    },
    BILLING_POLICY_REQUIRED: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_BILLING_POLICY_REQUIRED',
        message: 'Billing policy must exist before activating occupancy',
        messageForUser: 'api.resident.occupancyLifecycle.BILLING_POLICY_REQUIRED',
    },
    OVERLAPPING_TENANT: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_OVERLAPPING_TENANT',
        message: 'Tenant already has an active occupancy',
        messageForUser: 'api.resident.occupancyLifecycle.OVERLAPPING_TENANT',
    },
    UNIT_CAPACITY_EXCEEDED: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_UNIT_CAPACITY_EXCEEDED',
        message: 'Rental unit active occupancy capacity is exceeded',
        messageForUser: 'api.resident.occupancyLifecycle.UNIT_CAPACITY_EXCEEDED',
    },
    SCOPE_MISMATCH: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_SCOPE_MISMATCH',
        message: 'Occupancy organization, property and rental unit must match',
        messageForUser: 'api.resident.occupancyLifecycle.SCOPE_MISMATCH',
    },
    INVALID_STATUS: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_INVALID_STATUS',
        message: 'Occupancy lifecycle transition is not allowed',
        messageForUser: 'api.resident.occupancyLifecycle.INVALID_STATUS',
    },
}

const LIFECYCLE_SENDER = { dv: 1, fingerprint: 'occupancyLifecycle' }

function toCalendarDay (date) {
    return dayjs(date || new Date()).format('YYYY-MM-DD')
}

function previousDay (date) {
    return dayjs(date).subtract(1, 'day').format('YYYY-MM-DD')
}

function getSender (data) {
    return data.sender || LIFECYCLE_SENDER
}

function connectById (id) {
    return { connect: { id } }
}

function buildGenerationSummary (result) {
    return {
        createdCount: get(result, 'createdCount', 0),
        invoiceId: get(result, ['invoice', 'id']) || null,
    }
}

async function getRequiredOccupancy (occupancyId, context) {
    const occupancy = occupancyId && await getById('Occupancy', occupancyId)

    if (!occupancy || occupancy.deletedAt) {
        throw new GQLError(ERRORS.OCCUPANCY_NOT_FOUND, context)
    }

    return occupancy
}

async function getRequiredRentalUnit (rentalUnitId, context) {
    const rentalUnit = rentalUnitId && await getById('RentalUnit', rentalUnitId)

    if (!rentalUnit || rentalUnit.deletedAt) {
        throw new GQLError(ERRORS.RENTAL_UNIT_NOT_FOUND, context)
    }

    if (!rentalUnit.rentable) {
        throw new GQLError(ERRORS.UNIT_REQUIRED, context)
    }

    return rentalUnit
}

async function getBillingPolicy (propertyId) {
    const [policy] = await find('BillingPolicy', {
        property: { id: propertyId },
        deletedAt: null,
    })

    return policy || null
}

async function requireBillingPolicy (propertyId, context) {
    const policy = await getBillingPolicy(propertyId)

    if (!policy) {
        throw new GQLError(ERRORS.BILLING_POLICY_REQUIRED, context)
    }

    return policy
}

function assertScope ({ organizationId, propertyId, rentalUnit }, context) {
    if (rentalUnit.organization !== organizationId || rentalUnit.property !== propertyId) {
        throw new GQLError(ERRORS.SCOPE_MISMATCH, context)
    }
}

async function assertCanActivate ({ occupancyId, tenantId, rentalUnit, activationDate, allowConcurrentOccupancy }, context) {
    if (!tenantId) {
        throw new GQLError(ERRORS.TENANT_REQUIRED, context)
    }

    if (!allowConcurrentOccupancy) {
        const activeTenantOccupancies = await findActiveOccupancies({ tenantId, today: activationDate })

        if (activeTenantOccupancies.some(occupancy => occupancy.id !== occupancyId)) {
            throw new GQLError(ERRORS.OVERLAPPING_TENANT, context)
        }
    }

    const activeUnitOccupancies = await findActiveOccupancies({ rentalUnitId: rentalUnit.id, today: activationDate })

    if (activeUnitOccupancies.filter(occupancy => occupancy.id !== occupancyId).length >= Number(rentalUnit.capacity)) {
        throw new GQLError(ERRORS.UNIT_CAPACITY_EXCEEDED, context)
    }
}

async function runWithConcurrentOccupancyFlag (context, allowConcurrentOccupancy, callback) {
    const previousValue = context._allowConcurrentOccupancy
    context._allowConcurrentOccupancy = allowConcurrentOccupancy

    try {
        return await callback()
    } finally {
        context._allowConcurrentOccupancy = previousValue
    }
}

function buildOccupancyCreateData ({
    data,
    tenantId,
    rentalUnit,
    status,
    startDate,
    expectedEndDate,
}) {
    return {
        dv: 1,
        sender: getSender(data),
        organization: connectById(rentalUnit.organization),
        tenant: connectById(tenantId),
        property: connectById(rentalUnit.property),
        rentalUnit: connectById(rentalUnit.id),
        startDate,
        expectedEndDate: expectedEndDate || data.expectedEndDate,
        actualEndDate: null,
        billingFrequency: data.billingFrequency || BILLING_FREQUENCY_MONTHLY,
        monthlyRate: data.monthlyRate || rentalUnit.defaultMonthlyRate || '0',
        status,
    }
}

async function reserveRentalUnit (context, data) {
    const rentalUnit = await getRequiredRentalUnit(data.rentalUnitId, context)
    const tenantId = data.tenantId

    if (!tenantId) {
        throw new GQLError(ERRORS.TENANT_REQUIRED, context)
    }

    assertScope({
        organizationId: data.organizationId || rentalUnit.organization,
        propertyId: data.propertyId || rentalUnit.property,
        rentalUnit,
    }, context)

    return await Occupancy.create(context, buildOccupancyCreateData({
        data,
        tenantId,
        rentalUnit,
        status: OCCUPANCY_STATUS_PLANNED,
        startDate: toCalendarDay(data.startDate),
    }))
}

async function checkInOccupancy (context, data) {
    let occupancy = null
    let rentalUnit
    let tenantId

    if (data.occupancyId) {
        occupancy = await getRequiredOccupancy(data.occupancyId, context)
        if (![OCCUPANCY_STATUS_PLANNED, OCCUPANCY_STATUS_ACTIVE].includes(occupancy.status)) {
            throw new GQLError(ERRORS.INVALID_STATUS, context)
        }
        rentalUnit = await getRequiredRentalUnit(occupancy.rentalUnit, context)
        tenantId = occupancy.tenant
    } else {
        rentalUnit = await getRequiredRentalUnit(data.rentalUnitId, context)
        tenantId = data.tenantId
    }

    const activationDate = toCalendarDay(data.startDate || get(occupancy, 'startDate'))

    assertScope({
        organizationId: data.organizationId || get(occupancy, 'organization') || rentalUnit.organization,
        propertyId: data.propertyId || get(occupancy, 'property') || rentalUnit.property,
        rentalUnit,
    }, context)
    await requireBillingPolicy(rentalUnit.property, context)
    await assertCanActivate({
        occupancyId: get(occupancy, 'id'),
        tenantId,
        rentalUnit,
        activationDate,
        allowConcurrentOccupancy: data.allowConcurrentOccupancy === true,
    }, context)

    const occupancyData = {
        dv: 1,
        sender: getSender(data),
        startDate: activationDate,
        actualEndDate: null,
        status: OCCUPANCY_STATUS_ACTIVE,
        ...(data.expectedEndDate ? { expectedEndDate: data.expectedEndDate } : {}),
        ...(data.billingFrequency ? { billingFrequency: data.billingFrequency } : {}),
        ...(data.monthlyRate ? { monthlyRate: data.monthlyRate } : {}),
    }

    const activeOccupancy = await runWithConcurrentOccupancyFlag(context, data.allowConcurrentOccupancy === true, async () => {
        if (occupancy) {
            return await Occupancy.update(context, occupancy.id, occupancyData)
        }

        return await Occupancy.create(context, {
            ...buildOccupancyCreateData({
                data,
                tenantId,
                rentalUnit,
                status: OCCUPANCY_STATUS_ACTIVE,
                startDate: activationDate,
            }),
            ...occupancyData,
        })
    })

    const generationResult = await generateRentChargesForOccupancy(context, activeOccupancy, {
        cutoffDate: activationDate,
        sender: getSender(data),
    })

    return {
        occupancy: activeOccupancy,
        rentChargeGeneration: buildGenerationSummary(generationResult),
    }
}

async function renewOccupancy (context, data) {
    const occupancy = await getRequiredOccupancy(data.occupancyId, context)

    if (occupancy.status !== OCCUPANCY_STATUS_ACTIVE) {
        throw new GQLError(ERRORS.INVALID_STATUS, context)
    }

    return await Occupancy.update(context, occupancy.id, {
        dv: 1,
        sender: getSender(data),
        expectedEndDate: data.expectedEndDate,
        ...(data.monthlyRate ? { monthlyRate: data.monthlyRate } : {}),
        ...(data.billingFrequency ? { billingFrequency: data.billingFrequency } : {}),
    })
}

async function checkOutOccupancy (context, data) {
    const occupancy = await getRequiredOccupancy(data.occupancyId, context)

    if (occupancy.status !== OCCUPANCY_STATUS_ACTIVE) {
        throw new GQLError(ERRORS.INVALID_STATUS, context)
    }

    const actualEndDate = toCalendarDay(data.actualEndDate)
    const endedOccupancy = await Occupancy.update(context, occupancy.id, {
        dv: 1,
        sender: getSender(data),
        actualEndDate,
        status: OCCUPANCY_STATUS_ENDED,
    })

    let generationResult = null
    if (data.createFinalCharges !== false) {
        generationResult = await generateRentChargesForOccupancy(context, endedOccupancy, {
            cutoffDate: actualEndDate,
            includeCutoffMonth: true,
            sender: getSender(data),
        })
    }

    const arrears = await calculateOccupancyArrears(endedOccupancy.id)

    return {
        occupancy: endedOccupancy,
        rentChargeGeneration: buildGenerationSummary(generationResult),
        arrears,
    }
}

async function transferOccupancy (context, data) {
    const occupancy = await getRequiredOccupancy(data.occupancyId, context)

    if (occupancy.status !== OCCUPANCY_STATUS_ACTIVE) {
        throw new GQLError(ERRORS.INVALID_STATUS, context)
    }

    const targetRentalUnit = await getRequiredRentalUnit(data.targetRentalUnitId, context)
    assertScope({
        organizationId: occupancy.organization,
        propertyId: targetRentalUnit.property,
        rentalUnit: targetRentalUnit,
    }, context)
    await requireBillingPolicy(targetRentalUnit.property, context)

    const transferDate = toCalendarDay(data.transferDate)
    await assertCanActivate({
        tenantId: occupancy.tenant,
        rentalUnit: targetRentalUnit,
        activationDate: transferDate,
        allowConcurrentOccupancy: true,
    }, context)

    const checkoutResult = await checkOutOccupancy(context, {
        dv: data.dv,
        sender: getSender(data),
        occupancyId: occupancy.id,
        actualEndDate: previousDay(transferDate),
        createFinalCharges: data.createFinalCharges,
    })
    const checkInResult = await checkInOccupancy(context, {
        dv: data.dv,
        sender: getSender(data),
        tenantId: occupancy.tenant,
        rentalUnitId: targetRentalUnit.id,
        organizationId: occupancy.organization,
        propertyId: targetRentalUnit.property,
        startDate: transferDate,
        expectedEndDate: data.expectedEndDate || occupancy.expectedEndDate,
        billingFrequency: data.billingFrequency || occupancy.billingFrequency,
        monthlyRate: data.monthlyRate || occupancy.monthlyRate,
        allowConcurrentOccupancy: true,
    })

    return {
        previousOccupancy: checkoutResult.occupancy,
        newOccupancy: checkInResult.occupancy,
        rentChargeGeneration: checkInResult.rentChargeGeneration,
        previousArrears: checkoutResult.arrears,
    }
}

async function cancelOccupancy (context, data) {
    const occupancy = await getRequiredOccupancy(data.occupancyId, context)

    if (occupancy.status !== OCCUPANCY_STATUS_PLANNED) {
        throw new GQLError(ERRORS.INVALID_STATUS, context)
    }

    return await Occupancy.update(context, occupancy.id, {
        dv: 1,
        sender: getSender(data),
        status: OCCUPANCY_STATUS_CANCELED,
    })
}

module.exports = {
    ERRORS,
    cancelOccupancy,
    checkInOccupancy,
    checkOutOccupancy,
    renewOccupancy,
    reserveRentalUnit,
    transferOccupancy,
}
