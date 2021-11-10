const { GQLListSchema } = require('@core/keystone/schema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')
const { transformCRUDString } = require('./accessUtils')
const { perListAccess } = require('./accessControl')
const { prepareKeystoneExpressApp, setFakeClientMode } = require('@core/keystone/test.utils')

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
                    const HouseModified = perListAccess(House._type, House.name, House)
                    return
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