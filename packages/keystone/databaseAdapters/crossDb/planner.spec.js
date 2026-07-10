jest.mock('@open-keystone/server-side-graphql-client', () => ({
    getItems: jest.fn(),
}))

jest.mock('@open-condo/config', () => ({
    CROSS_DB_RELATION_FILTER_IDS_LIMIT: 50000,
}))

jest.mock('../sourceRegistry', () => ({
    getSourceRegistry: jest.fn(() => ({
        resolveSource: (tableName) => (tableName === 'Message' ? 'message' : 'main'),
    })),
    isCrossDbPlannerEnabled: () => true,
}))

jest.mock('@open-condo/keystone/databaseAdapters', () => ({
    getSourceRegistry: jest.fn(() => ({
        resolveSource: (tableName) => (tableName === 'Message' ? 'message' : 'main'),
    })),
    isCrossDbPlannerEnabled: () => true,
}))

jest.mock('@open-condo/keystone/databaseAdapters/utils', () => ({
    getDatabaseAdapter: jest.fn(() => ({
        listAdapters: {
            Message: {
                fieldAdapters: [
                    { isRelationship: true, refListKey: 'User', path: 'user' },
                ],
            },
        },
    })),
    isPrismaAdapter: () => false,
}))

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }),
}))

jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn(),
}))

const { getItems } = require('@open-keystone/server-side-graphql-client')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { CrossDbPlanner, prepareCrossDbWhere } = require('./planner')

describe('CrossDbPlanner.loadRelatedIds', () => {
    let planner

    beforeEach(() => {
        jest.clearAllMocks()
        getItems.mockReset()
        getSchemaCtx.mockReset()

        planner = new CrossDbPlanner({
            listKey: 'Message',
            adapter: {},
            isPrisma: false,
            knex: {},
            singleRelations: [],
            multipleRelations: [],
            resolveDbColumn: (name) => name,
            applyPrismaMultipleRelations: async (rows) => rows,
        })
    })

    test('loads relation ids by chunks with deterministic order', async () => {
        getSchemaCtx.mockResolvedValue({ keystone: {} })
        getItems
            .mockResolvedValueOnce(Array.from({ length: 1000 }, (_, i) => ({ id: `id-${i}` })))
            .mockResolvedValueOnce([{ id: 'id-1000' }, { id: 'id-1001' }])

        const ids = await planner.loadRelatedIds('User', { name_contains: 'john' })

        expect(ids).toHaveLength(1002)
        expect(getItems).toHaveBeenNthCalledWith(1, expect.objectContaining({
            listKey: 'User',
            sortBy: ['id_ASC'],
            first: 1000,
            skip: 0,
        }))
        expect(getItems).toHaveBeenNthCalledWith(2, expect.objectContaining({
            listKey: 'User',
            sortBy: ['id_ASC'],
            first: 1000,
            skip: 1000,
        }))
    })

    test('throws when relation ids exceed configured hard limit', async () => {
        getSchemaCtx.mockResolvedValue({ keystone: {} })
        getItems.mockResolvedValueOnce(Array.from({ length: 50001 }, (_, i) => ({ id: `id-${i}` })))

        await expect(planner.loadRelatedIds('User', { name_contains: 'john' }))
            .rejects
            .toThrow('Cross-db relation filter returned too many ids for User. Limit: 50000')
    })

    test('does not throw page limit error after terminal page', async () => {
        getSchemaCtx.mockResolvedValue({ keystone: {} })
        getItems
            .mockResolvedValueOnce(Array.from({ length: 1000 }, (_, i) => ({ id: `id-${i}` })))
            .mockResolvedValueOnce([])

        const ids = await planner.loadRelatedIds('User', { name_contains: 'john' })

        expect(ids).toHaveLength(1000)
        expect(getItems).toHaveBeenCalledTimes(2)
    })
})

describe('CrossDbPlanner.prepareWhere', () => {
    let planner

    beforeEach(() => {
        jest.clearAllMocks()
        getItems.mockReset()
        getSchemaCtx.mockReset()

        planner = new CrossDbPlanner({
            listKey: 'Message',
            adapter: {
                listAdapters: {
                    Message: {
                        fieldAdapters: [
                            { isRelationship: true, refListKey: 'User', path: 'user' },
                        ],
                    },
                },
            },
            isPrisma: false,
            knex: {},
            singleRelations: [['User', 'user']],
            multipleRelations: [],
            resolveDbColumn: (name) => name,
            applyPrismaMultipleRelations: async (rows) => rows,
            sourceRegistry: {
                resolveSource: (tableName) => (tableName === 'Message' ? 'message' : 'main'),
            },
        })
    })

    test('keeps direct id_in relation filter unchanged for GraphQL compatibility', async () => {
        const where = {
            type: 'REMINDER',
            user: { id_in: ['user-1', 'user-2'] },
            deletedAt: null,
        }

        const result = await planner.prepareWhere(where)

        expect(result).toEqual(where)
        expect(getItems).not.toHaveBeenCalled()
    })

    test('rewrites non-id relation filters to nested id_in', async () => {
        getSchemaCtx.mockResolvedValue({ keystone: {} })
        getItems.mockResolvedValueOnce([{ id: 'user-1' }, { id: 'user-2' }])

        const result = await planner.prepareWhere({
            user: { name_contains: 'john' },
        })

        expect(result).toEqual({ user: { id_in: ['user-1', 'user-2'] } })
    })

    test('rewrites empty positive relation _in groups to nested id_in []', async () => {
        getSchemaCtx.mockResolvedValue({ keystone: {} })
        getItems.mockResolvedValueOnce([])

        const result = await planner.prepareWhere({
            user_in: [{ name_contains: 'missing' }],
        })

        expect(result).toEqual({ user: { id_in: [] } })
    })
})

describe('prepareCrossDbWhere', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getSchemaCtx.mockResolvedValue({ keystone: {} })
    })

    test('keeps user id_in filter for Message queries', async () => {
        const where = {
            type: 'REMINDER',
            user: { id_in: ['user-1'] },
            deletedAt: null,
        }

        const result = await prepareCrossDbWhere({ listKey: 'Message', where })

        expect(result).toEqual(where)
    })
})
