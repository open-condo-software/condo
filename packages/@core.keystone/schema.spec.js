const { ArgumentError } = require('ow')
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

const EVENT_LIST = new GQLListSchema('Event', {
    fields: {
        name: {
            factory: () => faker.fake('{{name.firstName}}'),
            type: Text,
            hooks: {
                validateInput: async (ctx) => {await EVENT_LIST.emit('validateName', ctx)},
            },
        },
    },
    access: {
        read: false,
    },
    hooks: {
        validateInput: async (ctx) => {await EVENT_LIST.emit('validate', ctx)},
    },
})

test('List.factory(): has fields', () => {
    const obj = USER_LIST._factory()
    expect(Object.keys(obj)).toEqual(['name', 'email', 'isAdmin'])
    expect(obj['name']).toMatch(/^[\w .']+$/g)
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
    expect(Object.keys(newUser.schema.fields)).toEqual(['name'])
})

test('List.override(): set isAdmin defaultValue to true', () => {
    const newUser = USER_LIST._override({
        fields: {
            isAdmin: {
                type: Checkbox,
                defaultValue: true,
            },
        },
    })
    const obj = newUser._factory()
    expect(Object.keys(obj)).toEqual(['name', 'email', 'isAdmin'])
    expect(obj.isAdmin).toEqual(true)
})

test('List.override(): override part of field will raise an error', () => {
    const predicate = () => {
        // isAdmin field don't have type!
        USER_LIST._override({
            fields: {
                isAdmin: {
                    defaultValue: true,
                },
            },
        })
    }
    expect(predicate).toThrow(ArgumentError)
    expect(predicate).toThrow('to have keys `["type"]`')
})

test('List.override(): inherit events', async () => {
    const baseEventListener = jest.fn()
    const overrideEventListener = jest.fn()
    const newEventList = EVENT_LIST._override({
        fields: {
            foo: {
                type: Checkbox,
                defaultValue: true,
            },
        },
    })
    EVENT_LIST.on('validate', baseEventListener)
    newEventList.on('validate', overrideEventListener)

    await EVENT_LIST.schema.hooks.validateInput({ id: 1 })
    await newEventList.schema.hooks.validateInput({ id: 2 })

    expect(baseEventListener.mock.calls).toEqual([[{ id: 1 }], [{ id: 2 }]])
    expect(overrideEventListener.mock.calls).toEqual([[{ id: 1 }], [{ id: 2 }]])
})

const CALCULATOR_SERVICE = new GQLCustomSchema('CalculatorService', {
    types: [
        {
            access: true,
            type: 'input CalculatorInput { op: String!, l: String, r: String }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'calculate(data: CalculatorInput!): String',
            // https://www.apollographql.com/docs/apollo-server/data/resolvers/#resolver-arguments
            // https://www.keystonejs.com/keystonejs/keystone/#config-1
            resolver: async (parent, args, context, info, extra) => {
                const { op, l, r } = args
                return String(eval(`${l} ${op} ${r}`))
            },
        },
    ],
})

test('execute mutation func', async () => {
    const [parent, context, info, extra] = [jest.fn(), jest.fn(), jest.fn(), jest.fn()]
    const res = await CALCULATOR_SERVICE.schema.mutations[0].resolver(
        parent, { op: '+', l: 2, r: 2 }, context, info, extra)
    expect(res).toEqual('4')
})
