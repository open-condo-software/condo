/**
 * @jest-environment node
 */

const {
    REPAIR_REASON_MISSING_OCCUPANCY,
    REPAIR_REASON_OCCUPANCY_WITHOUT_TENANT,
    REPAIR_REASON_REPAIRABLE_FROM_OCCUPANCY,
    classifyLegacyRentChargeTenantRow,
    repairLegacyRentChargeTenants,
} = require('./rentChargeTenantRepair')

describe('rentChargeTenantRepair', () => {
    test('classifies null tenant with valid occupancy tenant as repairable', () => {
        const result = classifyLegacyRentChargeTenantRow({
            rentChargeId: 'rent-charge-1',
            occupancyId: 'occupancy-1',
            currentTenantId: null,
            currentTenantResidentId: null,
            occupancyTenantId: 'tenant-1',
            occupancyTenantResidentId: 'tenant-1',
        })

        expect(result).toEqual({
            status: 'repairable',
            reason: REPAIR_REASON_REPAIRABLE_FROM_OCCUPANCY,
            targetTenantId: 'tenant-1',
        })
    })

    test('classifies invalid current tenant with valid occupancy tenant as repairable', () => {
        const result = classifyLegacyRentChargeTenantRow({
            rentChargeId: 'rent-charge-2',
            occupancyId: 'occupancy-2',
            currentTenantId: 'invalid-tenant',
            currentTenantResidentId: null,
            occupancyTenantId: 'tenant-2',
            occupancyTenantResidentId: 'tenant-2',
        })

        expect(result).toEqual({
            status: 'repairable',
            reason: REPAIR_REASON_REPAIRABLE_FROM_OCCUPANCY,
            targetTenantId: 'tenant-2',
        })
    })

    test('reports missing occupancy rows as unresolved', async () => {
        const summary = await repairLegacyRentChargeTenants({
            fetchRows: jest.fn(async () => [{
                rentChargeId: 'rent-charge-3',
                occupancyId: null,
                currentTenantId: null,
                currentTenantResidentId: null,
                occupancyTenantId: null,
                occupancyTenantResidentId: null,
            }]),
            applyUpdates: jest.fn(),
        })

        expect(summary.unresolvedRows).toEqual([{
            rentChargeId: 'rent-charge-3',
            occupancyId: null,
            currentTenantId: null,
            occupancyTenantId: null,
            reason: REPAIR_REASON_MISSING_OCCUPANCY,
        }])
    })

    test('reports occupancy without tenant rows as unresolved', async () => {
        const summary = await repairLegacyRentChargeTenants({
            fetchRows: jest.fn(async () => [{
                rentChargeId: 'rent-charge-4',
                occupancyId: 'occupancy-4',
                currentTenantId: null,
                currentTenantResidentId: null,
                occupancyTenantId: null,
                occupancyTenantResidentId: null,
            }]),
            applyUpdates: jest.fn(),
        })

        expect(summary.unresolvedRows).toEqual([{
            rentChargeId: 'rent-charge-4',
            occupancyId: 'occupancy-4',
            currentTenantId: null,
            occupancyTenantId: null,
            reason: REPAIR_REASON_OCCUPANCY_WITHOUT_TENANT,
        }])
    })

    test('defaults to dry-run and does not apply updates', async () => {
        const applyUpdates = jest.fn(async () => ['rent-charge-5'])
        const summary = await repairLegacyRentChargeTenants({
            fetchRows: jest.fn(async () => [{
                rentChargeId: 'rent-charge-5',
                occupancyId: 'occupancy-5',
                currentTenantId: null,
                currentTenantResidentId: null,
                occupancyTenantId: 'tenant-5',
                occupancyTenantResidentId: 'tenant-5',
            }]),
            applyUpdates,
        })

        expect(summary.dryRun).toBe(true)
        expect(summary.repairableCount).toBe(1)
        expect(summary.repairedCount).toBe(0)
        expect(applyUpdates).not.toHaveBeenCalled()
    })

    test('applies updates only in explicit apply mode', async () => {
        const applyUpdates = jest.fn(async (rows) => rows.map(row => row.rentChargeId))
        const summary = await repairLegacyRentChargeTenants({
            fetchRows: jest.fn(async () => [{
                rentChargeId: 'rent-charge-6',
                occupancyId: 'occupancy-6',
                currentTenantId: 'stale-tenant',
                currentTenantResidentId: null,
                occupancyTenantId: 'tenant-6',
                occupancyTenantResidentId: 'tenant-6',
            }]),
            applyUpdates,
        }, { apply: true })

        expect(summary.dryRun).toBe(false)
        expect(summary.repairedCount).toBe(1)
        expect(summary.repairedIds).toEqual(['rent-charge-6'])
        expect(applyUpdates).toHaveBeenCalledWith([{
            rentChargeId: 'rent-charge-6',
            occupancyId: 'occupancy-6',
            currentTenantId: 'stale-tenant',
            targetTenantId: 'tenant-6',
            reason: REPAIR_REASON_REPAIRABLE_FROM_OCCUPANCY,
        }])
    })
})