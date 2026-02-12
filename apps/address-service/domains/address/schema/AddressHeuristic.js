const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@address-service/domains/address/access/AddressHeuristic')
const { HEURISTIC_TYPES } = require('@address-service/domains/common/constants/heuristicTypes')
const { PROVIDERS } = require('@address-service/domains/common/constants/providers')


const AddressHeuristic = new GQLListSchema('AddressHeuristic', {
    schemaDoc: 'A model storing provider-generated heuristic identifiers for cross-provider address deduplication',
    fields: {
        address: {
            schemaDoc: 'The address this heuristic belongs to',
            type: 'Relationship',
            ref: 'Address',
            isRequired: true,
        },

        type: {
            schemaDoc: 'The heuristic type (e.g. fias_id, coordinates, google_place_id, fallback)',
            type: 'Select',
            options: HEURISTIC_TYPES,
            isRequired: true,
        },

        value: {
            schemaDoc: 'The heuristic identifier value',
            type: 'Text',
            isRequired: true,
        },

        reliability: {
            schemaDoc: 'Reliability score, higher means more reliable',
            type: 'Integer',
            isRequired: true,
        },

        provider: {
            schemaDoc: 'Provider name that generated this heuristic (consistent with Address.meta.provider.name)',
            type: 'Select',
            options: PROVIDERS,
            isRequired: true,
        },

        latitude: {
            schemaDoc: 'Latitude for coordinate-type heuristics. Enables efficient range queries.',
            type: 'Decimal',
            knexOptions: { scale: 8 },
            isRequired: false,
        },

        longitude: {
            schemaDoc: 'Longitude for coordinate-type heuristics. Enables efficient range queries.',
            type: 'Decimal',
            knexOptions: { scale: 8 },
            isRequired: false,
        },

        meta: {
            schemaDoc: 'Provider-specific quality indicators (e.g. qc_geo for coordinates)',
            type: 'Json',
            isRequired: false,
        },

        enabled: {
            schemaDoc: 'Allows disabling a heuristic while investigating issues without deleting it',
            type: 'Checkbox',
            defaultValue: true,
            isRequired: true,
        },
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.UniqueConstraint',
                fields: ['type', 'value'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'addressheuristic_type_value_unique',
            },
        ],
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: access.canReadAddressHeuristics,
        create: access.canManageAddressHeuristics,
        update: access.canManageAddressHeuristics,
        delete: false,
        auth: true,
    },
})

module.exports = {
    AddressHeuristic,
}
