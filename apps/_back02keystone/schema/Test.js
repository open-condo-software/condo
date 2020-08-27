const {
    Checkbox,
    Decimal,
    Float,
    Integer,
    Select,
    Slug,
    Url,
    Uuid,
    Relationship,
} = require('@keystonejs/fields')
const { Content } = require('@keystonejs/fields-content')
const { GQLListSchema } = require('@core/keystone/schema')
const { Color } = require('@keystonejs/fields-color')
const { LocationGoogle } = require('@keystonejs/fields-location-google')

const Test = new GQLListSchema('Test', {
    fields: {
        heroColor: { type: Color },

        isEnabled: { type: Checkbox, isRequired: true },

        body: {
            type: Content,
            blocks: [
                Content.blocks.blockquote,
                Content.blocks.image,
                Content.blocks.link,
                Content.blocks.orderedList,
                Content.blocks.unorderedList,
                Content.blocks.heading,
            ],
        },

        rating1: { type: Integer, isRequired: true },
        rating2: { type: Float },
        rating3: { type: Decimal },
        venue: {
            type: LocationGoogle,
            googleMapsKey: 'no',
        },

        status_renamed: { type: Select, options: 'pending, processed', isRequired: true },
        uuid: {
            type: Uuid,
            isRequired: true,
        },
        url: {
            type: Url,
            isRequired: true,

        },
        slug: {
            type: Slug,
            isRequired: true,

        },
        users: {
            type: Relationship,
            ref: 'User',
            many: true,
        },
        self: {
            type: Relationship,
            ref: 'Test',
            many: false,
        },
        related: {
            type: Relationship,
            ref: 'Test',
            many: true,
        },
    },
    access: {
        read: true,
        create: true,
        update: true,
        delete: true,
        auth: true,
    },
})

module.exports = {
    Test,
}