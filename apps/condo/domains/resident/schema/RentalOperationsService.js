const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/resident/access/RentalOperationsService')
const {
    findAvailableHostelBeds,
    findAvailableRentalUnits,
    findExpiringOccupancies,
    findOccupiedRentalUnits,
    findResidentsWithArrears,
    getOrganizationRentArrearsSummary,
    getPropertyOccupancySummary,
    getResidentCurrentOccupancySummary,
} = require('@condo/domains/resident/utils/serverSchema/rentalOperations')

const RentalOperationsService = new GQLCustomSchema('RentalOperationsService', {
    types: [
        {
            access: true,
            type: 'input RentalAvailabilityInput { organizationId: ID, propertyId: ID!, startDate: String, expectedEndDate: String, unitType: String }',
        },
        {
            access: true,
            type: 'input RentalOccupancyQueryInput { organizationId: ID, propertyId: ID! }',
        },
        {
            access: true,
            type: 'input ExpiringOccupanciesInput { organizationId: ID, propertyId: ID, dateFrom: String, dateTo: String }',
        },
        {
            access: true,
            type: 'input RentalArrearsQueryInput { organizationId: ID, propertyId: ID }',
        },
        {
            access: true,
            type: 'input PropertyOccupancySummaryInput { organizationId: ID, propertyId: ID! }',
        },
        {
            access: true,
            type: 'input OrganizationRentArrearsSummaryInput { organizationId: ID! }',
        },
        {
            access: true,
            type: 'input ResidentRentalDashboardInput { residentId: ID! }',
        },
        {
            access: true,
            type: 'type RentalUnitAvailability { rentalUnit: RentalUnit!, capacity: Int!, occupiedCount: Int!, availableCapacity: Int! }',
        },
        {
            access: true,
            type: 'type RentalUnitAvailabilityOutput { items: [RentalUnitAvailability!]! }',
        },
        {
            access: true,
            type: 'type RentalOccupancySummary { occupancy: Occupancy!, resident: Resident, rentalUnit: RentalUnit, property: Property }',
        },
        {
            access: true,
            type: 'type RentalOccupancyListOutput { items: [RentalOccupancySummary!]! }',
        },
        {
            access: true,
            type: 'type RentalArrearsResident { resident: Resident, currentOccupancy: Occupancy, arrearsTotal: String!, currencyCode: String!, chargeCount: Int! }',
        },
        {
            access: true,
            type: 'type RentalArrearsResidentsOutput { items: [RentalArrearsResident!]! }',
        },
        {
            access: true,
            type: 'type ResidentRentalDashboard { currentRentalUnit: RentalUnit, occupancyStatus: String, billingFrequency: String, monthlyRate: String, unpaidRentCharges: [RentCharge!]!, linkedUnpaidInvoices: [Invoice!]!, arrearsTotal: String!, nextDueDate: String }',
        },
        {
            access: true,
            type: 'type PropertyOccupancySummary { totalRentableUnits: Int!, occupiedUnits: Int!, availableUnits: Int!, totalCapacity: Int!, occupiedCapacity: Int!, availableCapacity: Int! }',
        },
        {
            access: true,
            type: 'type OrganizationRentArrearsSummary { rentChargedTotal: String!, arrearsTotal: String!, currencyCode: String!, residentsWithArrearsCount: Int! }',
        },
    ],
    queries: [
        {
            access: access.canReadRentalOperations,
            schema: 'availableRentalUnits(data: RentalAvailabilityInput!): RentalUnitAvailabilityOutput',
            resolver: async (parent, args) => {
                return {
                    items: await findAvailableRentalUnits(args.data),
                }
            },
        },
        {
            access: access.canReadRentalOperations,
            schema: 'availableHostelBeds(data: RentalAvailabilityInput!): RentalUnitAvailabilityOutput',
            resolver: async (parent, args) => {
                return {
                    items: await findAvailableHostelBeds(args.data),
                }
            },
        },
        {
            access: access.canReadRentalOccupancyOperations,
            schema: 'occupiedRentalUnits(data: RentalOccupancyQueryInput!): RentalOccupancyListOutput',
            resolver: async (parent, args) => {
                return {
                    items: await findOccupiedRentalUnits(args.data),
                }
            },
        },
        {
            access: access.canReadRentalOccupancyOperations,
            schema: 'expiringOccupancies(data: ExpiringOccupanciesInput!): RentalOccupancyListOutput',
            resolver: async (parent, args) => {
                return {
                    items: await findExpiringOccupancies(args.data),
                }
            },
        },
        {
            access: access.canReadRentalOccupancyOperations,
            schema: 'overdueRentalResidents(data: RentalArrearsQueryInput!): RentalArrearsResidentsOutput',
            resolver: async (parent, args) => {
                return {
                    items: await findResidentsWithArrears(args.data),
                }
            },
        },
        {
            access: access.canReadRentalOccupancyOperations,
            schema: 'propertyOccupancySummary(data: PropertyOccupancySummaryInput!): PropertyOccupancySummary',
            resolver: async (parent, args) => {
                return await getPropertyOccupancySummary(args.data)
            },
        },
        {
            access: access.canReadRentalOccupancyOperations,
            schema: 'organizationRentArrearsSummary(data: OrganizationRentArrearsSummaryInput!): OrganizationRentArrearsSummary',
            resolver: async (parent, args) => {
                return await getOrganizationRentArrearsSummary(args.data.organizationId)
            },
        },
        {
            access: access.canReadResidentRentalDashboard,
            schema: 'residentRentalDashboard(data: ResidentRentalDashboardInput!): ResidentRentalDashboard',
            resolver: async (parent, args) => {
                return await getResidentCurrentOccupancySummary(args.data.residentId)
            },
        },
    ],
})

module.exports = {
    RentalOperationsService,
}
