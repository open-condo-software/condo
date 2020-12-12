const { GQLListSchema } = require('@core/keystone/schema')
const { Text, Select, Relationship, Checkbox } = require('@keystonejs/fields')
const { Json } = require('@app/_back02keystone/custom-fields')

const Function = new GQLListSchema('Function', {
    fields: {
        owner: {
            type: Relationship,
            ref: 'User',
            isRequired: true,
        },
        markerplaceName: {
            type: Text,
        },
        isPublished: {
            type: Checkbox,
        },
        language: {
            type: Select,
            options: "Python, Javascript",
            isRequired: true,
        },
        signature: {
            type: Json,
            isRequired: true,
        },
        description: {
            type: Text,
            isRequired: true,
        },
        body: {
            type: Text,
            isRequired: true,
        },
    },
    access: {
        read: true,
        create: true, // TODO only for developers
        update: true, // TODO only for owner
        delete: true, // TODO only for onwer
        auth: true,
    },
})

module.exports = {
    Function,
}
