const { Text, Relationship, Integer, DateTimeUtc, CalendarDay } = require('@keystonejs/fields')

const { GQLListSchema } = require('@core/keystone/schema')
const { Json } = require('@core/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { SENDER_FIELD, DV_FIELD, ORGANIZATION_OWNED_FIELD } = require('./_common')
const { WRONG_TEXT_FORMAT, JSON_EXPECT_OBJECT_ERROR, DV_UNKNOWN_VERSION_ERROR, JSON_UNKNOWN_VERSION_ERROR } = require('../constants/errors')
const { hasRequestAndDbFields } = require('../utils/validation.utils')
const { rules } = require('../access')
const { hasValidJsonStructure } = require('../utils/validation.utils')


const INTEGRATION_CONTEXT_FIELD = {
    schemaDoc: 'Integration context',
    type: Relationship,
    ref: 'BillingIntegrationOrganizationContext',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
}

const BILLING_PROPERTY_FIELD = {
    schemaDoc: 'Billing property',
    type: Relationship,
    ref: 'BillingProperty',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
}

const BILLING_ACCOUNT_FIELD = {
    schemaDoc: 'Billing account',
    type: Relationship,
    ref: 'BillingAccount',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
}

const BILLING_ACCOUNT_METER_FIELD = {
    schemaDoc: 'Billing account meter',
    type: Relationship,
    ref: 'BillingAccountMeter',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
}

const IMPORT_ID_FIELD = {
    schemaDoc: '`billing data source` local object ID. Used only for the internal needs of the `integration component`',
    type: Text,
    isRequired: false,
}

const RAW_DATA_FIELD = {
    schemaDoc: 'Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.',
    type: Json,
    isRequired: true,
}

const PERIOD_FIELD = {
    schemaDoc: 'Period date (01.2020, 02.2020, ...)',
    type: CalendarDay,
    isRequired: true,
    // TODO(pahaz): validate it
}

// 0. CHECK IS INTEGRATION EXISTS AND IS INTEGRATION TOKEN CORRECT
// 1. GET ALL INTEGRATION ORGANIZATION CONTEXTS (property: null, unit: null)
// 2. FOR ALL ORGANIZATION CONTEXTS WE WILL LAUNCH LOAD SYNC TASKS:
//    1. LOAD ALL PROPERTIES ... UNITS ...
//    2.
// 3. RUN TAP-LOADER ([PROPERTY1, PROPERTY2...], SETTINGS, STATE)

// NOTE: `This API` allows to our `clients` to extract data from their `billing data source` about `receipts` and perform two-way data exchange of `meter readings`.
// Schema: `billing data source` (remote system) <-> `integration component` <-> `this API` (platform)
// What data is being synced? There are ...

const BillingIntegration = new GQLListSchema('BillingIntegration', {
    schemaDoc: 'Identification of the `integration component` which responsible for getting data from the `billing data source` and delivering the data to `this API`. Examples: tap-1c, ... ',
    fields: {
        dv: DV_FIELD,
        // creating by developer hands and no needed to use anti-fraud detection `sender` field

        name: {
            schemaDoc: 'The name of the `integration component` that the developer remembers',
            type: Text,
            isRequired: true,
        },

        // settings data structure config (settings field for BillingIntegrationOrganizationContext)
        // state data structure config (state field for BillingIntegrationOrganizationContext)
        // log messages translation and adaptation (message field for BillingIntegrationLog)
        accessRights: {
            type: Relationship,
            ref: 'BillingIntegrationAccessRight.integration',
            many: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadBillingIntegrations,
        create: rules.canManageBillingIntegrations,
        update: rules.canManageBillingIntegrations,
        delete: false,
        auth: true,
    },
})

const BillingIntegrationAccessRight = new GQLListSchema('BillingIntegrationAccessRight', {
    schemaDoc: 'Link between billing integrations and users',
    fields: {
        dv: DV_FIELD,
        // creating by developer hands and no needed to use anti-fraud detection `sender` field

        integration: {
            schemaDoc: 'Integration',
            type: Relationship,
            ref: 'BillingIntegration.accessRights',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },
        user: {
            schemaDoc: 'User',
            type: Relationship,
            ref: 'User',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
    },
    plugins: [tracked(), historical()],
    access: {
        read: rules.canReadBillingIntegrationAccessRights,
        create: rules.canManageBillingIntegrationAccessRights,
        update: rules.canManageBillingIntegrationAccessRights,
        delete: rules.canManageBillingIntegrationAccessRights,
        auth: true,
    },
})

const BillingIntegrationOrganizationContext = new GQLListSchema('BillingIntegrationOrganizationContext', {
    schemaDoc: 'Integration state and settings for all organizations. The existence of this object means that there is a configured integration between the `billing data source` and `this API`',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        integration: {
            schemaDoc: 'ID of the integration that is configured to receive data for the organization',
            type: Relationship,
            ref: 'BillingIntegration',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },

        organization: ORGANIZATION_OWNED_FIELD,

        settings: {
            schemaDoc: 'Settings that are required to get data from the `billing data source`. It can also contain fine-tuning optional integration settings. The data structure depends on the integration and defined there',
            type: Json,
            isRequired: true,
            hooks: {
                validateInput: (args) => {
                    if (!hasValidJsonStructure(args, true, 1, {})) return
                },
            },
        },

        state: {
            schemaDoc: 'The current state of the integration process. Some integration need to store past state or data related to cache files/folders for past state. The data structure depends on the integration and defined there',
            type: Json,
            isRequired: true,
            hooks: {
                validateInput: (args) => {
                    if (!hasValidJsonStructure(args, true, 1, {})) return
                },
            },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadBillingIntegrationOrganizationContexts,
        create: rules.canManageBillingIntegrationOrganizationContexts,
        update: rules.canManageBillingIntegrationOrganizationContexts,
        delete: false,
        auth: true,
    },
})

const BillingIntegrationLog = new GQLListSchema('BillingIntegrationLog', {
    schemaDoc: 'Important `integration component` log records. Sometimes you need to report some errors/problems related to the integration process. ' +
        'The target audience of these messages is the client of our API platform. You should avoid repeating the same messages. ' +
        'The existence of the message means that some problems were occurred during the integration process and the client should the user must take some actions to eliminate them',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        context: INTEGRATION_CONTEXT_FIELD,

        type: {
            schemaDoc: 'Message type. Our clients can use different languages. Sometimes we need to change the text message for the client. The settings for the message texts are in the integration. Ex: WRONG_AUTH_CREDENTIALS',
            type: Text,
            isRequired: true,
            hooks: {
                validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
                    const value = resolvedData[fieldPath]
                    if (!/^[A-Z_]+$/.test(value)) addFieldValidationError(`${WRONG_TEXT_FORMAT}${fieldPath}] allow only [A-Z_] letters`)
                },
            },
        },

        message: {
            schemaDoc: 'Client understandable message. May be overridden by integration settings for some message types',
            type: Text,
            isRequired: true,
        },

        meta: {
            schemaDoc: 'The message metadata. Context variables for generating messages. ' +
                'Examples of data keys: ``',
            type: Json,
            isRequired: false,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted()],
    access: {
        read: rules.canReadBillingIntegrationLogs,
        create: rules.canManageBillingIntegrationLogs,
        update: rules.canManageBillingIntegrationLogs,
        delete: false,
        auth: true,
    },
})

const BillingProperty = new GQLListSchema('BillingProperty', {
    schemaDoc: 'All `property` objects from `billing data source`',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        context: INTEGRATION_CONTEXT_FIELD,

        importId: IMPORT_ID_FIELD,

        bindingId: {
            schemaDoc: 'A well-known universal identifier that allows you to identify the same objects in different systems. It may differ in different countries. Example: for Russia, the FIAS ID is used',
            type: Text,
            isRequired: true,
            kmigratorOptions: { unique: true, null: false },
        },

        address: {
            schemaDoc: 'The non-modified address from the `billing data source`. Used in `receipt template`',
            type: Text,
            isRequired: true,
        },

        raw: RAW_DATA_FIELD,

        meta: {
            schemaDoc: 'Structured metadata obtained from the `billing data source`. Some of this data is required for use in the `receipt template`. ' +
                'Examples of data keys: `total space of building`, `property beginning of exploitation year`, `has cultural heritage status`, `number of underground floors`, `number of above-ground floors`',
            // TODO(pahaz): research keys!
            type: Json,
            isRequired: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadBillingProperties,
        create: rules.canManageBillingProperties,
        update: rules.canManageBillingProperties,
        delete: false,
        auth: true,
    },
})

const BillingAccount = new GQLListSchema('BillingAccount', {
    schemaDoc: 'All `account` objects from `billing data source`. In close account cases, these objects should be soft deleted',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        context: INTEGRATION_CONTEXT_FIELD,

        importId: IMPORT_ID_FIELD,

        property: BILLING_PROPERTY_FIELD,

        bindingId: {
            schemaDoc: 'A well-known universal identifier that allows you to identify the same objects in different systems. It may differ in different countries. ' +
                'Example: for Russia, the dom.gosuslugi.ru account number is used',
            type: Text,
            isRequired: false,
            kmigratorOptions: { unique: true, null: true },
        },

        number: {
            schemaDoc: 'Account number',
            type: Text,
            isRequired: true,
        },

        unit: {
            schemaDoc: 'Property unit number (apartment number)',
            type: Text,
            isRequired: true,
        },

        raw: RAW_DATA_FIELD,

        meta: {
            schemaDoc: 'Structured metadata obtained from the `billing data source`. Some of this data is required for use in the `receipt template`. ' +
                'Examples of data keys: `property unit number`, `floor`, `entrance`, `is parking`',
            type: Json,
            isRequired: true,
            hooks: {
                validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
                    if (!resolvedData.hasOwnProperty(fieldPath)) return // skip if on value
                    const value = resolvedData[fieldPath]
                    if (value === null) return // null is OK
                    if (typeof value !== 'object') {return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] ${fieldPath} field type error. We expect JSON Object`)}
                    const { dv } = value
                    if (dv === 1) {
                        // TODO(pahaz): need to checkIt!
                    } else {
                        return addFieldValidationError(`${JSON_UNKNOWN_VERSION_ERROR}${fieldPath}] Unknown \`dv\` attr inside JSON Object`)
                    }
                },
            },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadBillingAccounts,
        create: rules.canManageBillingAccounts,
        update: rules.canManageBillingAccounts,
        delete: false,
        auth: true,
    },
    hooks: {
        validateInput: ({ resolvedData, existingItem, addValidationError }) => {
            if (!hasRequestAndDbFields(['dv', 'sender'], ['organization', 'source', 'status', 'classifier', 'details'], resolvedData, existingItem, addValidationError)) return
            const { dv } = resolvedData
            if (dv === 1) {
                // NOTE: version 1 specific translations. Don't optimize this logic
            } else {
                return addValidationError(`${DV_UNKNOWN_VERSION_ERROR}dv] Unknown \`dv\``)
            }
        },
    },
})

const BillingMeterResource = new GQLListSchema('BillingMeterResource', {
    schemaDoc: 'Meter `resource types`',
    fields: {
        dv: DV_FIELD,
        // creating by developer hands and no needed to use anti-fraud detection `sender` field

        name: {
            schemaDoc: 'The name of the `resource types`',
            type: Text,
            isRequired: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadBillingMeterResources,
        create: rules.canManageBillingMeterResources,
        update: rules.canManageBillingMeterResources,
        delete: false,
        auth: true,
    },
})

const BillingAccountMeter = new GQLListSchema('BillingAccountMeter', {
    schemaDoc: 'All `personal meter` (non `whole-building meter`) objects from `billing data source`. In case of the meter can measure several resources we create a separate object for each resource',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        context: INTEGRATION_CONTEXT_FIELD,

        importId: IMPORT_ID_FIELD,

        property: BILLING_PROPERTY_FIELD, // denormalize

        account: BILLING_ACCOUNT_FIELD,
        resource: {
            schemaDoc: 'Meter resource types',
            type: Relationship,
            ref: 'BillingMeterResource',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },

        raw: RAW_DATA_FIELD,

        meta: {
            schemaDoc: 'Structured metadata obtained from the `billing data source`. Some of this data is required for use in the `receipt template`. ' +
                'Examples of data keys: `sealing date`, `install date`, `verification date`, `serial number`, `units of measurement`',
            // TODO(pahaz): research keys!
            type: Json,
            isRequired: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadBillingAccountMeters,
        create: rules.canManageBillingAccountMeters,
        update: rules.canManageBillingAccountMeters,
        delete: false,
        auth: true,
    },
})

const BillingAccountMeterReading = new GQLListSchema('BillingAccountMeterReading', {
    schemaDoc: 'Meter reading. In a multi-tariff meter case, we store all values in one object',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        context: INTEGRATION_CONTEXT_FIELD,

        importId: IMPORT_ID_FIELD,

        property: BILLING_PROPERTY_FIELD, // denormalize
        account: BILLING_ACCOUNT_FIELD, // denormalize

        meter: BILLING_ACCOUNT_METER_FIELD,
        period: PERIOD_FIELD,
        value1: {
            schemaDoc: 'Meter reading value of tariff 1',
            type: Integer,
            isRequired: true,
        },
        value2: {
            schemaDoc: 'Meter reading value of tariff 2',
            type: Integer,
            isRequired: true,
        },
        value3: {
            schemaDoc: 'Meter reading value of tariff 3',
            type: Integer,
            isRequired: true,
        },
        date: {
            schemaDoc: 'Date of reading',
            type: DateTimeUtc,
            isRequired: true,
        },

        raw: RAW_DATA_FIELD,
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadAccountMeterReadings,
        create: rules.canManageAccountMeterReadings,
        update: rules.canManageAccountMeterReadings,
        delete: false,
        auth: true,
    },
})

const BillingReceipt = new GQLListSchema('BillingReceipt', {
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        context: INTEGRATION_CONTEXT_FIELD,

        importId: IMPORT_ID_FIELD,

        property: BILLING_PROPERTY_FIELD, // denormalize

        account: BILLING_ACCOUNT_FIELD,
        period: PERIOD_FIELD,

        raw: RAW_DATA_FIELD,

        toPay: {
            schemaDoc: 'Total sum to pay. The sum of all services',
            type: Text,
            isRequired: true,
        },
        services: {
            schemaDoc: 'Structured items in the receipt obtained from the `billing data source`. Amount of payment is required for use in the `receipt template`. ' +
                'Structure example: {"Maintenance and repair": {"name": "maintenance-and-repair", "payment": "1129.17", "currency": "RUB", "formula": "payment = tariff * volume + recalculation + privilege + penalty", "tariff": "19.95", "volume": "56.6", "isByMeter": true, "recalculation": "0.0", "privilege": "0.0", "penalty": "0"}, ...}',
            type: Json,
            isRequired: true,
            // TODO(pahaz): validation
        },
        meta: {
            schemaDoc: 'Structured metadata obtained from the `billing data source`. Some of this data is required for use in the `receipt template`. ' +
                'Examples of data keys: `payer name`, `full address`, `living space`, `non-living space`, `registered residents`, `living residents`, `news message`',
            // TODO(pahaz): research keys!
            type: Json,
            isRequired: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadBillingReceipts,
        create: rules.canManageBillingReceipts,
        update: rules.canManageBillingReceipts,
        delete: false,
        auth: true,
    },
})

module.exports = {
    BillingIntegration,
    BillingIntegrationAccessRight,
    BillingIntegrationOrganizationContext,
    BillingIntegrationLog,
    BillingProperty,
    BillingAccount,
    BillingMeterResource,
    BillingAccountMeter,
    BillingAccountMeterReading,
    BillingReceipt,
}
