const { GQLListSchema } = require('@core/keystone/schema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')
const { transformCRUDString } = require('./accessUtils')
const { perListAccess } = require('./accessControl')
const { prepareKeystoneExpressApp, setFakeClientMode } = require('@core/keystone/test.utils')
const { isAsyncFunction } = require('util/types')

describe('accessControl', () => {
    setFakeClientMode(require.resolve('../../../../index.js'))
    let keystone
    beforeAll(async () => {
        const res = await prepareKeystoneExpressApp(require.resolve('../../../../index.js'))
        keystone = res.keystone
        keystone.createList = () => void 0
    })

    test('CRUD string parsing', () => {
        let str = 'crud'
        let parsed = transformCRUDString(str)
        expect(parsed).toEqual({
            create: true,
            read: true,
            update: true,
            delete: true,
        })

        str = 'du'
        parsed = transformCRUDString(str)
        expect(parsed).toEqual({
            create: false,
            read: false,
            update: true,
            delete: true,
        })

        str = ''
        parsed = transformCRUDString(str)
        expect(parsed).toEqual({
            create: false,
            read: false,
            update: false,
            delete: false,
        })

        str = 'dddd'
        parsed = transformCRUDString(str)
        expect(parsed).toEqual({
            create: false,
            read: false,
            update: false,
            delete: true,
        })
    })
    describe('perListAccess', () => {
        describe('Fake schema', () => {
            describe('Wraps list access', () => {
                test('Static boolean', () => {
                    const House = new GQLListSchema('House', {
                        schemaDoc: 'Sample house, where a person will live',
                        fields: {
                            name: {
                                type: Text,
                            },
                            address: {
                                type: Text,
                            },
                        },
                        access: {
                            read: true,
                            create: true,
                            update: true,
                            delete: false,
                        },
                    })
                    House._register(keystone, [perListAccess])
                    const HouseTransformed = perListAccess(House._type, House.name, House)

                    expect(typeof HouseTransformed.schema.access.read).toBe('function')
                    expect(isAsyncFunction(HouseTransformed.schema.access.read)).toBe(false)

                    expect(typeof HouseTransformed.schema.access.create).toBe('function')
                    expect(isAsyncFunction(HouseTransformed.schema.access.create)).toBe(false)

                    expect(typeof HouseTransformed.schema.access.update).toBe('function')
                    expect(isAsyncFunction(HouseTransformed.schema.access.update)).toBe(false)
                    
                    expect(typeof HouseTransformed.schema.access.delete).toBe('boolean')
                })
                test('Dynamic function', async () => {
                    const readMock = jest.fn(({ operation }) => {
                        return operation === 'read'
                    })
                    const createMock = jest.fn(({ operation }) => {
                        return operation === 'create'
                    })
                    const updateMock = jest.fn(({ operation }) => {
                        return  operation === 'update'
                    })
                    const deleteMock = jest.fn(({ operation }) => {
                        return  operation === 'delete'
                    })

                    const fakeMocks = { read: readMock, create: createMock, update: updateMock, delete: deleteMock }
                    const House = new GQLListSchema('House', {
                        schemaDoc: 'Sample house, where a person will live',
                        fields: {
                            name: {
                                type: Text,
                            },
                            address: {
                                type: Text,
                            },
                        },
                        access: {
                            read: readMock,
                            create: createMock,
                            update: updateMock,
                            delete: deleteMock,
                        },
                    })
                    House._register(keystone, [perListAccess])

                    const HouseTransformed = perListAccess(House._type, House.name, House)
                    expect(isAsyncFunction(HouseTransformed.schema.access.create)).toBe(true)
                    expect(isAsyncFunction(HouseTransformed.schema.access.read)).toBe(true)
                    expect(isAsyncFunction(HouseTransformed.schema.access.update)).toBe(true)
                    expect(isAsyncFunction(HouseTransformed.schema.access.delete)).toBe(true)
                    expect(HouseTransformed.schema.access.auth).toBe(false)

                    Object.keys(HouseTransformed.schema.access).forEach(async (operation) => {
                        if (operation === 'auth') return
                        const rawArgs = { authentication: { item: {} }, operation }
                        const fn = HouseTransformed.schema.access[operation]
                        const accResult = await fn(rawArgs)
                        expect(fakeMocks[operation]).lastCalledWith({
                            authentication: { item: {} }, 
                            operation,
                            permissions: {
                                create: false,
                                delete: false,
                                read: false,
                                update: false,
                            },
                        })
                        expect(accResult).toBe(true)
                    })
                    Object.keys(HouseTransformed.schema.access).forEach(async (operation, i, arr) => {
                        if (operation === 'auth') return
                        const wrongOperation = arr[i === 0 ? arr.length - 1 : i - 1]
                        const rawArgs = { authentication: { item: {} }, operation: wrongOperation }
                        const fn = HouseTransformed.schema.access[operation]
                        const accResult = await fn(rawArgs)
                        console.log(fakeMocks, operation, fakeMocks[operation])
                        expect(fakeMocks[operation]).lastCalledWith({
                            authentication: { item: {} }, 
                            operation: wrongOperation,
                            permissions: {
                                create: false,
                                delete: false,
                                read: false,
                                update: false,
                            },
                        })
                        expect(accResult).toBe(false)
                    })
                })
            })
            test('Performs static allowed operations', async () => {
                const House = new GQLListSchema('House', {
                    schemaDoc: 'Sample house, where a person will live',
                    fields: {
                        name: {
                            type: Text,
                        },
                        address: {
                            type: Text,
                        },
                    },
                    access: {
                        read: true,
                        create: true,
                        update: true,
                        delete: false,
                    },
                })
                const HouseModified = perListAccess(House._type, House.name, House)
                const user = await makeClientWithServiceUser()
            })

        })
    })
    describe('perFieldAccess', () => {
        return
    })
    describe('perMutationAccess', () => {
        return
    })
})