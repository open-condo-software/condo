const REPAIR_REASON_MISSING_OCCUPANCY = 'missing_occupancy'
const REPAIR_REASON_OCCUPANCY_WITHOUT_TENANT = 'occupancy_without_tenant'
const REPAIR_REASON_OCCUPANCY_WITH_INVALID_TENANT = 'occupancy_with_invalid_tenant'
const REPAIR_REASON_REPAIRABLE_FROM_OCCUPANCY = 'repairable_from_occupancy'

function classifyLegacyRentChargeTenantRow (row) {
    if (row.currentTenantResidentId) {
        return {
            status: 'valid',
            reason: null,
            targetTenantId: null,
        }
    }

    if (row.occupancyTenantResidentId) {
        return {
            status: 'repairable',
            reason: REPAIR_REASON_REPAIRABLE_FROM_OCCUPANCY,
            targetTenantId: row.occupancyTenantId,
        }
    }

    if (!row.occupancyId) {
        return {
            status: 'unresolved',
            reason: REPAIR_REASON_MISSING_OCCUPANCY,
            targetTenantId: null,
        }
    }

    if (!row.occupancyTenantId) {
        return {
            status: 'unresolved',
            reason: REPAIR_REASON_OCCUPANCY_WITHOUT_TENANT,
            targetTenantId: null,
        }
    }

    return {
        status: 'unresolved',
        reason: REPAIR_REASON_OCCUPANCY_WITH_INVALID_TENANT,
        targetTenantId: null,
    }
}

function summarizeLegacyRentChargeTenantRows (rows) {
    const summary = {
        checkedCount: rows.length,
        validCount: 0,
        repairableCount: 0,
        unresolvedCount: 0,
        repairableRows: [],
        unresolvedRows: [],
    }

    for (const row of rows) {
        const classification = classifyLegacyRentChargeTenantRow(row)

        if (classification.status === 'valid') {
            summary.validCount += 1
            continue
        }

        if (classification.status === 'repairable') {
            const repairableRow = {
                rentChargeId: row.rentChargeId,
                occupancyId: row.occupancyId,
                currentTenantId: row.currentTenantId,
                targetTenantId: classification.targetTenantId,
                reason: classification.reason,
            }

            summary.repairableCount += 1
            summary.repairableRows.push(repairableRow)
            continue
        }

        summary.unresolvedCount += 1
        summary.unresolvedRows.push({
            rentChargeId: row.rentChargeId,
            occupancyId: row.occupancyId,
            currentTenantId: row.currentTenantId,
            occupancyTenantId: row.occupancyTenantId,
            reason: classification.reason,
        })
    }

    return summary
}

async function repairLegacyRentChargeTenants (operations, options = {}) {
    const apply = options.apply === true
    const rows = await operations.fetchRows()
    const summary = summarizeLegacyRentChargeTenantRows(rows)

    let repairedIds = []
    if (apply && summary.repairableRows.length > 0) {
        repairedIds = await operations.applyUpdates(summary.repairableRows)
    }

    return {
        dryRun: !apply,
        checkedCount: summary.checkedCount,
        validCount: summary.validCount,
        repairableCount: summary.repairableCount,
        repairedCount: repairedIds.length,
        unresolvedCount: summary.unresolvedCount,
        repairedIds,
        repairableRows: summary.repairableRows,
        unresolvedRows: summary.unresolvedRows,
    }
}

function createLegacyRentChargeTenantRepairOperations (knex) {
    return {
        fetchRows: async () => {
            return await knex('RentCharge as rc')
                .leftJoin('Occupancy as o', function () {
                    this.on('rc.occupancy', '=', 'o.id')
                    this.onNull('o.deletedAt')
                })
                .leftJoin('Resident as currentTenant', function () {
                    this.on('rc.tenant', '=', 'currentTenant.id')
                    this.onNull('currentTenant.deletedAt')
                })
                .leftJoin('Resident as occupancyTenant', function () {
                    this.on('o.tenant', '=', 'occupancyTenant.id')
                    this.onNull('occupancyTenant.deletedAt')
                })
                .whereNull('rc.deletedAt')
                .where(function () {
                    this.whereNull('rc.tenant')
                    this.orWhere(function () {
                        this.whereNotNull('rc.tenant')
                        this.whereNull('currentTenant.id')
                    })
                })
                .orderBy('rc.createdAt', 'asc')
                .select([
                    'rc.id as rentChargeId',
                    'rc.occupancy as occupancyId',
                    'rc.tenant as currentTenantId',
                    'currentTenant.id as currentTenantResidentId',
                    'o.tenant as occupancyTenantId',
                    'occupancyTenant.id as occupancyTenantResidentId',
                ])
        },
        applyUpdates: async (repairableRows) => {
            return await knex.transaction(async (trx) => {
                const repairedIds = []

                for (const row of repairableRows) {
                    const updatedRowsCount = await trx('RentCharge')
                        .where({ id: row.rentChargeId })
                        .whereNull('deletedAt')
                        .update({
                            tenant: row.targetTenantId,
                            updatedAt: trx.fn.now(),
                        })

                    if (updatedRowsCount > 0) {
                        repairedIds.push(row.rentChargeId)
                    }
                }

                return repairedIds
            })
        },
    }
}

module.exports = {
    REPAIR_REASON_MISSING_OCCUPANCY,
    REPAIR_REASON_OCCUPANCY_WITHOUT_TENANT,
    REPAIR_REASON_OCCUPANCY_WITH_INVALID_TENANT,
    REPAIR_REASON_REPAIRABLE_FROM_OCCUPANCY,
    classifyLegacyRentChargeTenantRow,
    createLegacyRentChargeTenantRepairOperations,
    repairLegacyRentChargeTenants,
    summarizeLegacyRentChargeTenantRows,
}