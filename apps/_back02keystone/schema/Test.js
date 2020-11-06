const { versioning } = require('../custom-plugins')
const {
    Checkbox,
    Decimal,
    Float,
    Integer,
    Select,
    Slug,
    Url,
    Uuid,
    Text,
    Relationship,
} = require('@keystonejs/fields')
const { Content } = require('@keystonejs/fields-content')
const { GQLListSchema } = require('@core/keystone/schema')
const { Color } = require('@keystonejs/fields-color')
const { LocationGoogle } = require('@keystonejs/fields-location-google')
const { byTracking, atTracking } = require('@keystonejs/list-plugins')
const { v4: uuid } = require('uuid')
const { Stars, Options, JsonText } = require('../custom-fields')

const Test = new GQLListSchema('Test', {
    fields: {
        heroColor: { type: Color },

        isEnabled: { type: Checkbox, isRequired: true, defaultValue: false },

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

        rating1: { type: Integer, isRequired: true, defaultValue: 3 },
        rating2: { type: Float },
        rating3: { type: Decimal },
        venue: {
            type: LocationGoogle,
            googleMapsKey: 'no',
        },

        status_renamed: { type: Select, options: 'pending, processed', isRequired: true, defaultValue: 'no' },
        uuid: {
            type: Uuid,
            isRequired: true,
            defaultValue: () => uuid(),
        },
        url: {
            type: Url,
            isRequired: true,
            defaultValue: () => '/'
        },
        slug: {
            type: Slug,
            isRequired: true,
            from: 'id',
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

        rating: { type: Stars, starCount: 5 },
        settings: { type: Options, options: ['Feature1', 'Feature2'] },
        meta: { type: JsonText },
        text: { type: Text },
    },
    access: {
        read: true,
        create: true,
        update: true,
        delete: true,
        auth: true,
    },
    plugins: [byTracking(), atTracking(), versioning()],
})

module.exports = {
    Test,
}