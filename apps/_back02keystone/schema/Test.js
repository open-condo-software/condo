const { historical, versioned, uuided, tracked, softDeleted } = require('../custom-plugins')
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
    DateTimeUtc,
    DateTime,
    CalendarDay,
    File,
    Password,
    Virtual,
} = require('@keystonejs/fields')
const { Content } = require('@keystonejs/fields-content')
const { GQLListSchema } = require('@core/keystone/schema')
const { Color } = require('@keystonejs/fields-color')
const { LocationGoogle } = require('@keystonejs/fields-location-google')
const { v4: uuid } = require('uuid')
const { Stars, Options, Json, AutoIncrementInteger } = require('../custom-fields')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const conf = require('@core/config')

const adapter = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/test`,
    path: `${conf.MEDIA_URL}/test`,
})

const Test = new GQLListSchema('Test', {
    fields: {
        date1: { type: DateTime },
        utc: { type: DateTimeUtc },
        day: { type: CalendarDay },
        file: { type: File, adapter },
        pass: { type: Password },
        vir1: {
            type: Virtual,
            access: { create: false, update: false, delete: false, read: true },
            resolver: (item) => item.day ? '!' : 'no date!',
        },

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

        status_renamed: { type: Select, options: 'pending, processed, no', isRequired: true, defaultValue: 'no' },
        uuid: {
            type: Uuid,
            isRequired: true,
            defaultValue: () => uuid(),
        },
        url: {
            type: Url,
            isRequired: true,
            defaultValue: 'scheme:[//authority]path[?query][#fragment]',
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
        meta: { type: Json },
        text: { type: Text },
        item: {
            type: Relationship,
            ref: 'TestItem',
        },
    },
    access: {
        read: true,
        create: true,
        update: true,
        delete: true,
        auth: true,
    },
    plugins: [versioned(), tracked(), historical()],
})

const TestItem = new GQLListSchema('TestItem', {
    fields: {
        test: {
            type: Relationship,
            ref: 'Test',
            isRequired: true,
        },
        meta: {
            type: Json,
            defaultValue: {},
            isRequired: true,
        },
    },
    access: {
        read: true,
        create: true,
        update: true,
        delete: true,
        auth: true,
    },
    plugins: [uuided(), versioned(), tracked(), historical()],
})

const TestSoftDeletedObj = new GQLListSchema('TestSoftDeletedObj', {
    fields: {
        meta: {
            type: Json,
        },
    },
    access: {
        read: true,
        create: true,
        update: true,
        delete: true,
        auth: true,
    },
    plugins: [versioned(), tracked(), softDeleted(), historical()]
})

const TestAutoIncrementNumber = new GQLListSchema('TestAutoIncrementNumber', {
    fields: {
        number: {
            type: AutoIncrementInteger,
            isRequired: false,
            kmigratorOptions: { unique: true, null: false },
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
    TestItem,
    TestSoftDeletedObj,
    TestAutoIncrementNumber,
}
