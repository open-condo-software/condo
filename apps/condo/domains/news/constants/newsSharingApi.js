// This file contains API contract for NewsSharing feature.
// Changing this file likely introduces breaking changes to condo!

// Common schema

const DV_FIELD_SCHEMA = {
    type: 'integer',
}

const SCOPES_FIELD_SCHEMA = {
    type: 'object',
    properties: {
        organization: { type: ['string', 'null'] },
        property: { type: ['string', 'null'] },
        unitName: { type: ['string', 'null'] },
        unitType: { type: ['string', 'null'] },
    },
    required: ['organization', 'property', 'unitName', 'unitType'],
    additionalProperties: false,
}

const PROPERTIES_FIELD_SCHEMA = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        address: { type: 'string' },
        addressMeta: { type: 'object' },
    },
    required: ['id', 'address', 'addressMeta'],
    additionalProperties: false,
}

const ORGANIZATION_FIELD_SCHEMA = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        tin: { type: 'string' },
        name: { type: 'string' },
    },
    required: ['id', 'tin', 'name'],
    additionalProperties: false,
}

// GetCustomRecipientsCounters

const GET_CUSTOM_RECIPIENTS_COUNTERS_REQUEST_SCHEMA = {
    type: 'object',
    properties: {
        dv: DV_FIELD_SCHEMA,

        organization: ORGANIZATION_FIELD_SCHEMA,

        properties: {
            type: 'array',
            items: PROPERTIES_FIELD_SCHEMA,
        },

        scopes: {
            type: 'array',
            items: SCOPES_FIELD_SCHEMA,
        },
    },
    required: ['dv', 'organization', 'properties', 'scopes'],
    additionalProperties: false,
}

const GET_CUSTOM_RECIPIENTS_COUNTERS_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        receiversCount: { type: 'number' },
    },
    required: [],
    additionalProperties: false,
}

module.exports = {
    GET_CUSTOM_RECIPIENTS_COUNTERS_REQUEST_SCHEMA,
    GET_CUSTOM_RECIPIENTS_COUNTERS_RESPONSE_SCHEMA,
}