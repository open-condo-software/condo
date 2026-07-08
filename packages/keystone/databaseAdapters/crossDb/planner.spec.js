jest.mock('@open-keystone/server-side-graphql-client', () => ({
    getItems: jest.fn(),
}))

jest.mock('@open-condo/config', () => ({
    CROSS_DB_RELATION_FILTER_IDS_LIMIT: 50000,
}))

jest.mock('@open-condo/keystone/databaseAdapters', () => ({
    getSourceRegistry: jest.fn(),
    isCrossDbPlannerEnabled: () => true,
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

const { CrossDbPlanner } = require('./planner')

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
