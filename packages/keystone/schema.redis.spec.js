const ADD_SCHEMA = { addSchema: jest.fn() }

function createListAndAttachAdapter (SchemaModule, schemaName, adapterFindMock, dbExecuteFindMock = null) {
    const { GQLListSchema } = SchemaModule
    const schema = new GQLListSchema(schemaName, {
        fields: {
            name: {
                type: 'Text',
            },
        },
        access: {
            read: true,
        },
    })

    schema._register([], ADD_SCHEMA)
    schema._keystone = {
        adapter: dbExecuteFindMock ? { executeFind: dbExecuteFindMock } : {},
        lists: {
            [schemaName]: {
                adapter: {
                    find: adapterFindMock,
                    _create: jest.fn(),
                    _update: jest.fn(),
                    _delete: jest.fn(),
                    itemsQuery: jest.fn(),
                },
            },
        },
    }
}

describe('schema.find adapter delegation', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    test('delegates find to db adapter executeFind if present', async () => {
        const SchemaModule = require('./schema')
        const adapterFindMock = jest.fn().mockResolvedValue([{ id: 'db1', name: 'FromListAdapter' }])
        const executeFindMock = jest.fn().mockResolvedValue([{ id: 'r1', name: 'FromDbAdapter' }])
        createListAndAttachAdapter(SchemaModule, 'User', adapterFindMock, executeFindMock)

        const result = await SchemaModule.find('User', { id: 'r1' })
        expect(result).toEqual([{ id: 'r1', name: 'FromDbAdapter' }])
        expect(executeFindMock).toHaveBeenCalledWith(expect.objectContaining({
            schemaName: 'User',
            condition: { id: 'r1' },
            listAdapter: expect.any(Object),
        }))
        expect(adapterFindMock).not.toHaveBeenCalled()
        await SchemaModule.unregisterAllSchemas()
    })

    test('falls back to list adapter find if db adapter has no executeFind', async () => {
        const SchemaModule = require('./schema')
        const adapterFindMock = jest.fn().mockResolvedValue([{ id: 'db1', name: 'FromSql' }])
        createListAndAttachAdapter(SchemaModule, 'User', adapterFindMock)

        const result = await SchemaModule.find('User', { id: 'db1' })
        expect(result).toEqual([{ id: 'db1', name: 'FromSql' }])
        expect(adapterFindMock).toHaveBeenCalledWith({ id: 'db1' })
        await SchemaModule.unregisterAllSchemas()
    })

    test('delegates itemsQuery to db adapter executeItemsQuery if present', async () => {
        const SchemaModule = require('./schema')
        const adapterFindMock = jest.fn().mockResolvedValue([])
        const itemsQueryMock = jest.fn().mockResolvedValue([{ id: 'x1' }])
        const executeItemsQueryMock = jest.fn().mockResolvedValue([{ id: 'x2' }])
        const { GQLListSchema } = SchemaModule
        const schema = new GQLListSchema('User', {
            fields: { name: { type: 'Text' } },
            access: { read: true },
        })
        schema._register([], ADD_SCHEMA)
        schema._keystone = {
            adapter: {
                executeItemsQuery: executeItemsQueryMock,
            },
            lists: {
                User: {
                    adapter: {
                        find: adapterFindMock,
                        itemsQuery: itemsQueryMock,
                    },
                },
            },
        }

        const result = await SchemaModule.itemsQuery('User', { where: { id: 'x2' } })
        expect(result).toEqual([{ id: 'x2' }])
        expect(executeItemsQueryMock).toHaveBeenCalledWith(expect.objectContaining({
            schemaName: 'User',
            args: { where: { id: 'x2' } },
            listAdapter: expect.any(Object),
        }))
        expect(itemsQueryMock).not.toHaveBeenCalled()
        await SchemaModule.unregisterAllSchemas()
    })

    test('delegates create/update/delete to db adapter hooks', async () => {
        const SchemaModule = require('./schema')
        const listCreateMock = jest.fn()
        const listUpdateMock = jest.fn()
        const listDeleteMock = jest.fn()
        const executeCreateMock = jest.fn().mockResolvedValue({ id: 'c1' })
        const executeUpdateMock = jest.fn().mockResolvedValue({ id: 'u1' })
        const executeDeleteMock = jest.fn().mockResolvedValue(1)
        const { GQLListSchema } = SchemaModule
        const schema = new GQLListSchema('User', {
            fields: { name: { type: 'Text' } },
            access: { read: true },
        })
        schema._register([], ADD_SCHEMA)
        schema._keystone = {
            adapter: {
                executeCreate: executeCreateMock,
                executeUpdate: executeUpdateMock,
                executeDelete: executeDeleteMock,
            },
            lists: {
                User: {
                    adapter: {
                        find: jest.fn(),
                        itemsQuery: jest.fn(),
                        _create: listCreateMock,
                        _update: listUpdateMock,
                        _delete: listDeleteMock,
                    },
                },
            },
        }

        const created = await SchemaModule.create('User', { name: 'n1' })
        const updated = await SchemaModule.update('User', 'u1', { name: 'n2' })
        const removed = await SchemaModule.delete('User', 'u1')

        expect(created).toEqual({ id: 'c1' })
        expect(updated).toEqual({ id: 'u1' })
        expect(removed).toEqual(1)
        expect(executeCreateMock).toHaveBeenCalledWith(expect.objectContaining({ schemaName: 'User', data: { name: 'n1' } }))
        expect(executeUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ schemaName: 'User', id: 'u1', data: { name: 'n2' } }))
        expect(executeDeleteMock).toHaveBeenCalledWith(expect.objectContaining({ schemaName: 'User', id: 'u1' }))
        expect(listCreateMock).not.toHaveBeenCalled()
        expect(listUpdateMock).not.toHaveBeenCalled()
        expect(listDeleteMock).not.toHaveBeenCalled()
        await SchemaModule.unregisterAllSchemas()
    })

    test('falls back to list adapter mutations without db adapter hooks', async () => {
        const SchemaModule = require('./schema')
        const listCreateMock = jest.fn().mockResolvedValue({ id: 'c2' })
        const listUpdateMock = jest.fn().mockResolvedValue({ id: 'u2' })
        const listDeleteMock = jest.fn().mockResolvedValue(1)
        const { GQLListSchema } = SchemaModule
        const schema = new GQLListSchema('User', {
            fields: { name: { type: 'Text' } },
            access: { read: true },
        })
        schema._register([], ADD_SCHEMA)
        schema._keystone = {
            adapter: {},
            lists: {
                User: {
                    adapter: {
                        find: jest.fn(),
                        itemsQuery: jest.fn(),
                        _create: listCreateMock,
                        _update: listUpdateMock,
                        _delete: listDeleteMock,
                    },
                },
            },
        }

        const created = await SchemaModule.create('User', { name: 'n1' })
        const updated = await SchemaModule.update('User', 'u2', { name: 'n2' })
        const removed = await SchemaModule.delete('User', 'u2')

        expect(created).toEqual({ id: 'c2' })
        expect(updated).toEqual({ id: 'u2' })
        expect(removed).toEqual(1)
        expect(listCreateMock).toHaveBeenCalledWith({ name: 'n1' })
        expect(listUpdateMock).toHaveBeenCalledWith('u2', { name: 'n2' })
        expect(listDeleteMock).toHaveBeenCalledWith('u2')
        await SchemaModule.unregisterAllSchemas()
    })
})
