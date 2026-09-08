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
})
