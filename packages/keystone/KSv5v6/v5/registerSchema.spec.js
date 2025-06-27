const { DateTimeUtc } = require('@open-keystone/fields')
const { cloneDeep } = require('lodash/lang')

const { convertStringToTypes } = require('./registerSchema')

const { Json, DateInterval, Text } = require('../../fields')
const { GQLListSchema } = require('../../schema')

const TestMessage = new GQLListSchema('TestMessage', {
    schemaDoc: 'Notification message',
    fields: {
        organization: {
            schemaDoc: 'This message is related to some organization. Organization can manage their messages',
            type: 'Relationship',
            ref: 'Organization',
            kmigratorOptions: { null: true, on_delete: 'models.CASCADE' },
        },

        user: {
            schemaDoc: 'to User',
            type: 'Relationship',
            ref: 'User',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.CASCADE' },
        },

        lang: {
            schemaDoc: 'Message status',
            type: 'Select',
            options: Object.keys(['ru', 'en']).join(','),
            isRequired: true,
        },

        type: {
            schemaDoc: 'Message type',
            type: 'Text',
            isRequired: true,
        },

        type2: {
            schemaDoc: 'Message type 2',
            type: 'Text',
            isRequired: true,
        },

        meta: {
            schemaDoc: 'Message context',
            type: 'Json',
            isRequired: true,
            hooks: {
                validateInput: () => false,
            },
        },

        status: {
            schemaDoc: 'Message status',
            type: 'Select',
            defaultValue: 'init',
            options: 'init, new, delivered',
            isRequired: true,
        },

        interval: {
            schemaDoc: 'Message interval',
            type: 'DateInterval',
            defaultValue: 'P10D',
            isRequired: true,
        },

        deliveredAt: {
            schemaDoc: 'Delivered at time',
            type: 'DateTimeUtc',
            isRequired: false,
        },
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.CheckConstraint',
                check: 'Q(user__isnull=False) | Q(phone__isnull=False) | Q(email__isnull=False)',
                name: 'has_phone_or_email_or_user',
            },
        ],
    },
    plugins: [],
    access: {
        read: true,
        create: () => false,
        update: () => false,
        delete: false,
        auth: true,
    },
})

test('convertStringToTypes()', () => {
    const schema = cloneDeep(TestMessage.schema)
    convertStringToTypes(schema)
    expect(schema.fields.deliveredAt.type).toBe(DateTimeUtc)
    expect(schema.fields.meta.type).toBe(Json)
    expect(schema.fields.interval.type).toBe(DateInterval)
    expect(schema.fields.type.type).toBe(Text)
    expect(schema.fields.type2.type).toBe(Text)
    expect(schema.fields.type2.type).toMatchObject(schema.fields.type.type)
})
