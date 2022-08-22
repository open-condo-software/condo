const { GQLListSchema, GQLCustomSchema, registerSchemas, unregisterAllSchemas } = require('./schema')
const { Text } = require('@keystonejs/fields')
const { labelResolver, getDefaultAdminConfig } = require('./KSv5v6/v5/registerSchema')

const validateInput = async (ctx) => { await EVENT_LIST._emit('validate', ctx) }
const EVENT_LIST = new GQLListSchema('Event', {
    fields: {
        name: {
            type: 'Text',
            hooks: {
                validateInput,
            },
        },
    },
    access: {
        read: false,
    },
    hooks: {
        validateInput,
    },
})

test('List name and schema', () => {
    expect(EVENT_LIST.name).toEqual('Event')
    expect(EVENT_LIST.schema).toMatchObject({
        fields: {
            name: {
                type: 'Text',
                hooks: {
                    validateInput,
                },
            },
        },
        access: {
            read: false,
        },
        hooks: {
            validateInput,
        },
    })
})

test('List emit and on event', async () => {
    const baseEventListener = jest.fn()
    EVENT_LIST._on('validate', baseEventListener)
    await EVENT_LIST.schema.hooks.validateInput({ id: 1 })
    expect(baseEventListener.mock.calls).toEqual([[{ id: 1 }]])
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
                const { foo, bar } = args
                return foo + bar
            },
        },
    ],
})

test('execute mutation func', async () => {
    const [parent, context, info, extra] = [jest.fn(), jest.fn(), jest.fn(), jest.fn()]
    const res = await CALCULATOR_SERVICE.schema.mutations[0].resolver(
        parent, { foo: 2, bar: 2 }, context, info, extra)
    expect(res).toEqual(4)
})

const USER_FIELDS = {
    name: {
        type: Text,
        defaultValue: 'username',
    },
}

const ORGANIZATION_FIELDS = {
    name: {
        type: Text,
        defaultValue: 'orgname',
    },
}

test('registerSchema without preprocessors', () => {
    const keystone = { createList: jest.fn(), extendGraphQLSchema: jest.fn() }
    const modules = [
        {
            User: new GQLListSchema('User', {
                fields: {
                    name: {
                        type: Text,
                        defaultValue: 'username',
                    },
                },
                access: {
                    read: false,
                },
            }),
        }, {
            Organization: new GQLListSchema('Organization', {
                fields: {
                    name: {
                        type: Text,
                        defaultValue: 'orgname',
                    },
                },
                access: {
                    read: false,
                },
            }),
        },
    ]

    unregisterAllSchemas()
    registerSchemas(keystone, modules)
    unregisterAllSchemas()

    expect(keystone.extendGraphQLSchema.mock.calls).toEqual([])
    expect(keystone.createList.mock.calls).toEqual([
        ['User', {
            fields: USER_FIELDS,
            access: {
                read: false,
            },
            adminConfig: getDefaultAdminConfig(USER_FIELDS),
            labelResolver,
            plugins: undefined,
        }],
        ['Organization', {
            fields: ORGANIZATION_FIELDS,
            access: {
                read: false,
            },
            adminConfig: getDefaultAdminConfig(ORGANIZATION_FIELDS),
            labelResolver,
            plugins: undefined,
        }],
    ])
})

test('registerSchema with preprocessors', () => {
    const keystone = { createList: jest.fn(), extendGraphQLSchema: jest.fn() }
    const modules = [
        {
            User: new GQLListSchema('User', {
                fields: USER_FIELDS,
                access: {
                    read: false,
                },
            }),
        }, {
            Organization: new GQLListSchema('Organization', {
                fields: ORGANIZATION_FIELDS,
                access: {
                    read: false,
                },
            }),
        },
    ]

    function customPreprocessor1 () {
        return ((schemaType, name, schema) => {
            return {
                ...schema,
                foo: 'bar',
            }
        })
    }

    function customPreprocessor2 () {
        return ((schemaType, name, schema) => {
            if (name === 'Organization') schema.access.update = false
            return {
                ...schema,
                bar: 'buz',
            }
        })
    }

    unregisterAllSchemas()
    registerSchemas(keystone, modules, [customPreprocessor1(), customPreprocessor2()])
    unregisterAllSchemas()

    expect(keystone.extendGraphQLSchema.mock.calls).toEqual([])
    expect(keystone.createList.mock.calls).toEqual([
        ['User', {
            fields: USER_FIELDS,
            access: {
                read: false,
            },
            adminConfig: getDefaultAdminConfig(USER_FIELDS),
            labelResolver,
            plugins: undefined,
            foo: 'bar',
            bar: 'buz',
        }],
        ['Organization', {
            fields: ORGANIZATION_FIELDS,
            access: {
                read: false,
                update: false,
            },
            adminConfig: getDefaultAdminConfig(ORGANIZATION_FIELDS),
            labelResolver,
            plugins: undefined,
            foo: 'bar',
            bar: 'buz',
        }],
    ])
})