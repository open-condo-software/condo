jest.mock('@open-keystone/server-side-graphql-client', () => ({
    getItems: jest.fn(),
}))

jest.mock('@open-condo/config', () => ({
    CROSS_DB_RELATION_FILTER_IDS_LIMIT: 50000,
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

const { CrossDbPlanner } = require('@open-condo/keystone/databaseAdapters/crossDb')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

function createPlanner () {
    return new CrossDbPlanner({
        listKey: 'Message',
        adapter: {},
        isPrisma: false,
        knex: {},
        singleRelations: [],
        multipleRelations: [],
        resolveDbColumn: (name) => name,
        applyPrismaMultipleRelations: async (rows) => rows,
    })
}

describe('GqlWithKnexLoadList cross-db relation ids loader', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getItems.mockReset()
        getSchemaCtx.mockReset()
    })

    test('loads relation ids by chunks with deterministic order', async () => {
        const planner = createPlanner()

        getSchemaCtx.mockReturnValue({ keystone: {} })
        getItems
            .mockResolvedValueOnce(Array.from({ length: 1000 }, (_, i) => ({ id: `id-${i}` })))
            .mockResolvedValueOnce([{ id: 'id-1000' }, { id: 'id-1001' }])

        const ids = await planner.loadRelatedIds('User', { name_contains: 'john' })

        expect(ids).toHaveLength(1002)
        expect(getItems).toHaveBeenNthCalledWith(1, expect.objectContaining({
            listKey: 'User',
            where: { name_contains: 'john' },
            sortBy: ['id_ASC'],
            first: 1000,
        }))
        expect(getItems).toHaveBeenNthCalledWith(2, expect.objectContaining({
            listKey: 'User',
            where: { AND: [{ name_contains: 'john' }, { id_gt: 'id-999' }] },
            sortBy: ['id_ASC'],
            first: 1000,
        }))
        expect(getItems.mock.calls[0][0]).not.toHaveProperty('skip')
        expect(getItems.mock.calls[1][0]).not.toHaveProperty('skip')
    })

    test('throws when relation ids exceed configured hard limit', async () => {
        const planner = createPlanner()

        getSchemaCtx.mockReturnValue({ keystone: {} })
        getItems.mockResolvedValueOnce(Array.from({ length: 50001 }, (_, i) => ({ id: `id-${i}` })))

        await expect(planner.loadRelatedIds('User', { name_contains: 'john' }))
            .rejects
            .toThrow('Cross-db relation filter returned too many ids for User. Limit: 50000')
    })

    test('does not throw page limit error after terminal page', async () => {
        const planner = createPlanner()

        getSchemaCtx.mockReturnValue({ keystone: {} })
        getItems
            .mockResolvedValueOnce(Array.from({ length: 1000 }, (_, i) => ({ id: `id-${i}` })))
            .mockResolvedValueOnce([])

        const ids = await planner.loadRelatedIds('User', { name_contains: 'john' })

        expect(ids).toHaveLength(1000)
        expect(getItems).toHaveBeenCalledTimes(2)
        expect(getItems).toHaveBeenNthCalledWith(2, expect.objectContaining({
            where: { AND: [{ name_contains: 'john' }, { id_gt: 'id-999' }] },
        }))
    })
})
