const SUBSCRIPTION_PLAN_TYPE_SERVICE = 'service'
const SUBSCRIPTION_PLAN_TYPE_FEATURE = 'feature'
const SUBSCRIPTION_PLAN_TYPES = [SUBSCRIPTION_PLAN_TYPE_SERVICE, SUBSCRIPTION_PLAN_TYPE_FEATURE]

const SUBSCRIPTION_PLAN_FEATURE_FIELDS = {
    payments: {
        schemaDoc: 'Whether payments feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    meters: {
        schemaDoc: 'Whether meters feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    tickets: {
        schemaDoc: 'Whether tickets feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    news: {
        schemaDoc: 'Whether news feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    marketplace: {
        schemaDoc: 'Whether marketplace feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    support: {
        schemaDoc: 'Whether support feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    ai: {
        schemaDoc: 'Whether AI feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    customization: {
        schemaDoc: 'Whether customization feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    properties: {
        schemaDoc: 'Whether properties feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
    analytics: {
        schemaDoc: 'Whether analytics feature is included in this plan',
        type: 'Checkbox',
        defaultValue: false,
        isRequired: true,
    },
}

const SUBSCRIPTION_PLAN_FEATURES = Object.keys(SUBSCRIPTION_PLAN_FEATURE_FIELDS)

module.exports = {
    SUBSCRIPTION_PLAN_TYPE_SERVICE,
    SUBSCRIPTION_PLAN_TYPE_FEATURE,
    SUBSCRIPTION_PLAN_TYPES,
    SUBSCRIPTION_PLAN_FEATURE_FIELDS,
    SUBSCRIPTION_PLAN_FEATURES,
}
