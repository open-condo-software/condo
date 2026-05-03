const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/resident/access/OccupancyLifecycleService')
const {
    cancelOccupancy,
    checkInOccupancy,
    checkOutOccupancy,
    renewOccupancy,
    reserveRentalUnit,
    transferOccupancy,
} = require('@condo/domains/resident/utils/serverSchema/occupancyLifecycle')

const OccupancyLifecycleService = new GQLCustomSchema('OccupancyLifecycleService', {
    types: [
        {
            access: true,
            type: 'input ReserveRentalUnitInput { dv: Int!, sender: SenderFieldInput!, organizationId: ID, propertyId: ID, tenantId: ID!, rentalUnitId: ID!, startDate: String!, expectedEndDate: String, monthlyRate: String, billingFrequency: String }',
        },
        {
            access: true,
            type: 'input CheckInOccupancyInput { dv: Int!, sender: SenderFieldInput!, occupancyId: ID, organizationId: ID, propertyId: ID, tenantId: ID, rentalUnitId: ID, startDate: String, expectedEndDate: String, monthlyRate: String, billingFrequency: String, allowConcurrentOccupancy: Boolean }',
        },
        {
            access: true,
            type: 'input RenewOccupancyInput { dv: Int!, sender: SenderFieldInput!, occupancyId: ID!, expectedEndDate: String!, monthlyRate: String, billingFrequency: String }',
        },
        {
            access: true,
            type: 'input CheckOutOccupancyInput { dv: Int!, sender: SenderFieldInput!, occupancyId: ID!, actualEndDate: String!, createFinalCharges: Boolean }',
        },
        {
            access: true,
            type: 'input TransferOccupancyInput { dv: Int!, sender: SenderFieldInput!, occupancyId: ID!, targetRentalUnitId: ID!, transferDate: String!, expectedEndDate: String, monthlyRate: String, billingFrequency: String, createFinalCharges: Boolean }',
        },
        {
            access: true,
            type: 'input CancelOccupancyInput { dv: Int!, sender: SenderFieldInput!, occupancyId: ID! }',
        },
        {
            access: true,
            type: 'type OccupancyLifecycleRentChargeGeneration { createdCount: Int!, invoiceId: ID }',
        },
        {
            access: true,
            type: 'type OccupancyLifecycleArrears { amount: String!, currencyCode: String!, chargeCount: Int! }',
        },
        {
            access: true,
            type: 'type OccupancyLifecycleResult { occupancy: Occupancy!, rentChargeGeneration: OccupancyLifecycleRentChargeGeneration! }',
        },
        {
            access: true,
            type: 'type OccupancyCheckoutResult { occupancy: Occupancy!, rentChargeGeneration: OccupancyLifecycleRentChargeGeneration!, arrears: OccupancyLifecycleArrears! }',
        },
        {
            access: true,
            type: 'type OccupancyTransferResult { previousOccupancy: Occupancy!, newOccupancy: Occupancy!, rentChargeGeneration: OccupancyLifecycleRentChargeGeneration!, previousArrears: OccupancyLifecycleArrears! }',
        },
    ],

    mutations: [
        {
            access: access.canManageOccupancyLifecycle,
            schema: 'reserveRentalUnit(data: ReserveRentalUnitInput!): Occupancy',
            resolver: async (parent, args, context) => {
                return await reserveRentalUnit(context, args.data)
            },
        },
        {
            access: access.canManageOccupancyLifecycle,
            schema: 'checkInOccupancy(data: CheckInOccupancyInput!): OccupancyLifecycleResult',
            resolver: async (parent, args, context) => {
                return await checkInOccupancy(context, args.data)
            },
        },
        {
            access: access.canManageOccupancyLifecycle,
            schema: 'renewOccupancy(data: RenewOccupancyInput!): Occupancy',
            resolver: async (parent, args, context) => {
                return await renewOccupancy(context, args.data)
            },
        },
        {
            access: access.canManageOccupancyLifecycle,
            schema: 'transferOccupancy(data: TransferOccupancyInput!): OccupancyTransferResult',
            resolver: async (parent, args, context) => {
                return await transferOccupancy(context, args.data)
            },
        },
        {
            access: access.canManageOccupancyLifecycle,
            schema: 'checkOutOccupancy(data: CheckOutOccupancyInput!): OccupancyCheckoutResult',
            resolver: async (parent, args, context) => {
                return await checkOutOccupancy(context, args.data)
            },
        },
        {
            access: access.canManageOccupancyLifecycle,
            schema: 'cancelOccupancy(data: CancelOccupancyInput!): Occupancy',
            resolver: async (parent, args, context) => {
                return await cancelOccupancy(context, args.data)
            },
        },
    ],
})

module.exports = {
    OccupancyLifecycleService,
}
