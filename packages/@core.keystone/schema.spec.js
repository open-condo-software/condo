const faker = require('faker')
const { Text, Checkbox } = require('@keystonejs/fields')

const { GQLListSchema, GQLCustomSchema } = require('./schema')
const USER_LIST = new GQLListSchema('User', {
    fields: {
        name: {
            factory: () => faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}'),
            type: Text,
        },
        email: {
            factory: () => faker.internet.exampleEmail(),
            type: Text,
            isUnique: true,
            access: false,
        },
        isAdmin: {
            type: Checkbox,
            defaultValue: false,
        },
    },
    access: {
        read: false,
    },
})

test('List.factory(): has fields', () => {
    const obj = USER_LIST._factory()
    expect(Object.keys(obj)).toEqual(['name', 'email', 'isAdmin'])
    expect(obj['name']).toMatch(/^[\w .]+$/g)
    expect(obj['email']).toMatch(/^[a-z0-9A-Z._]+@example\.(org|com|net)$/g)
    expect(obj['isAdmin']).toEqual(false)
})

test('List.factory(): check undefined', () => {
    const obj = USER_LIST._factory({ isAdmin: undefined })
    expect(Object.keys(obj)).toEqual(['name', 'email'])
    expect(obj['isAdmin']).toBeUndefined()
    expect(obj['somethingOthers']).toBeUndefined()
})

test('List.override(): disable isAdmin field', () => {
    const newUser = USER_LIST._override({
        fields: {
            isAdmin: null,
            email: undefined,
        },
    })
    expect (Object.keys(newUser.schema.fields)).toEqual(["name"])
})

test('List.override(): set isAdmin defaultValue to true', () => {
    const newUser = USER_LIST._override({
        fields: {
            isAdmin: {
                type: Checkbox,
                defaultValue: true
            },
        },
    })
    const obj = newUser._factory()
    expect(Object.keys(obj)).toEqual(['name', 'email', 'isAdmin'])
    expect(obj.isAdmin).toEqual(true)
})
