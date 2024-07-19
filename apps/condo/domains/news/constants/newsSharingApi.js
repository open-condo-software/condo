// This file contains API contract for NewsSharing feature.
// Changing this file likely introduces breaking changes to condo!

// Common schema

const DV_FIELD_SCHEMA = {
    type: 'integer',
}

const SHARING_PARAMS_FIELD_SCHEMA = {
    type: 'object',
    properties: {
        dv: { type: 'integer' },
        customFormValues: { type: 'object' },
    },
    required: ['dv'],
    additionalProperties: false,
}



const SCOPES_FIELD_SCHEMA = {
    type: 'object',
    properties: {
        organizationId: { type: 'string' },
        propertyId: { type: 'string' },
        unitName: { type: 'string' },
        unitType: { type: 'string' },
    },
    required: ['organizationId', 'propertyId', 'unitName', 'unitType'],
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

// Publish

const PUBLISH_REQUEST_SCHEMA = {
    type: 'object',
    properties: {
        dv: DV_FIELD_SCHEMA,

        organization: {
            type: 'array',
            items: ORGANIZATION_FIELD_SCHEMA,
        },

        properties: {
            type: 'array',
            items: PROPERTIES_FIELD_SCHEMA,
        },

        newsItem: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                body: { type: 'string' },
                validBefore: { type: 'string' },
                type: { type: 'string' },
                publishedAt: { type: 'string' },
                sendAt: { type: 'string' },
            },
        },

        newsItemSharing: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                recipients: {
                    type: 'object',
                    properties: {
                        source: { type: 'string' },
                        scopes: SCOPES_FIELD_SCHEMA,
                        recipients: { type: 'array' },
                    },
                },
                sharingParams: { type: 'object' },
            },
        },

        scopes: {
            type: 'array',
            items: SCOPES_FIELD_SCHEMA,
        },
    },
    required: ['organization', 'properties', 'dv', 'scopes', 'newsItem', 'newsItemSharing'],
    additionalProperties: false,
}

const PUBLISH_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        dv: DV_FIELD_SCHEMA,
        remoteId: { type: 'string' },
        success: { type: 'boolean' },
        statusText: { type: 'string' },
    },
    required: ['success', 'dv', 'statusText'],
    additionalProperties: false,
}

// GetRecipients

const GET_RECIPIENTS_REQUEST_SCHEMA = {
    dv: DV_FIELD_SCHEMA,
}

const GET_RECIPIENTS_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        dv: DV_FIELD_SCHEMA,
    },
    required: ['', 'dv'],
    additionalProperties: false,
}

// GetCustomRecipientsCounters

const GET_CUSTOM_RECIPIENTS_COUNTERS_REQUEST_SCHEMA = {
    type: 'object',
    properties: {
        dv: DV_FIELD_SCHEMA,

        organization: {
            type: 'array',
            items: ORGANIZATION_FIELD_SCHEMA,
        },

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
        dv: DV_FIELD_SCHEMA,
        receiversCount: { type: 'number' },
    },
    required: ['', 'dv'],
    additionalProperties: false,
}

module.exports = {
    PUBLISH_REQUEST_SCHEMA,
    PUBLISH_RESPONSE_SCHEMA,

    GET_RECIPIENTS_REQUEST_SCHEMA,
    GET_RECIPIENTS_RESPONSE_SCHEMA,

    GET_CUSTOM_RECIPIENTS_COUNTERS_REQUEST_SCHEMA,
    GET_CUSTOM_RECIPIENTS_COUNTERS_RESPONSE_SCHEMA,
}