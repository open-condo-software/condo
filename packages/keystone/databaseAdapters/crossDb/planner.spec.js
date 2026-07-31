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
        getSchemaCtx.mockReturnValue({ keystone: {} })
        getItems.mockResolvedValueOnce(Array.from({ length: 50001 }, (_, i) => ({ id: `id-${i}` })))

        await expect(planner.loadRelatedIds('User', { name_contains: 'john' }))
            .rejects
            .toThrow('Cross-db relation filter returned too many ids for User. Limit: 50000')
    })

    test('does not throw page limit error after terminal page', async () => {
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
        getSchemaCtx.mockReturnValue({ keystone: {} })
        getItems.mockResolvedValueOnce([{ id: 'user-1' }, { id: 'user-2' }])

        const result = await planner.prepareWhere({
            user: { name_contains: 'john' },
        })

        expect(result).toEqual({ user: { id_in: ['user-1', 'user-2'] } })
    })

    test('flattens OR of cross-source relation filters to base id_in', async () => {
        getSchemaCtx.mockReturnValue({ keystone: {} })
        getItems.mockResolvedValueOnce([{ id: 'user-1' }])
        getItems.mockResolvedValueOnce([{ id: 'msg-1' }, { id: 'msg-2' }])

        const result = await planner.prepareWhere({
            OR: [
                { user: { name_contains: 'john' } },
            ],
        })

        expect(result).toEqual({ id_in: ['msg-1', 'msg-2'] })
        expect(getItems).toHaveBeenCalledWith(expect.objectContaining({
            listKey: 'User',
            where: { name_contains: 'john' },
        }))
        expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({
            listKey: 'Message',
            where: { user: { id_in: ['user-1'] } },
            first: 1000,
        }))
    })

    test('rewrites same-pool nested relation where via related-list planner', async () => {
        getSchemaCtx.mockReturnValue({ keystone: {} })
        getItems.mockResolvedValueOnce([{ id: 'user-1' }])
        getItems.mockResolvedValueOnce([{ id: 'msg-nested-1' }])

        // MessageFile.receipt → Message (same pool); nested user filter is cross-source for Message
        const filePlanner = new CrossDbPlanner({
            listKey: 'MessageFile',
            adapter: {
                listAdapters: {
                    MessageFile: {
                        fieldAdapters: [
                            { isRelationship: true, refListKey: 'Message', path: 'receipt' },
                        ],
                    },
                    Message: {
                        fieldAdapters: [
                            { isRelationship: true, refListKey: 'User', path: 'user' },
                        ],
                    },
                },
            },
            isPrisma: false,
            knex: {},
            singleRelations: [],
            multipleRelations: [],
            resolveDbColumn: (name) => name,
            applyPrismaMultipleRelations: async (rows) => rows,
            sourceRegistry: {
                resolveSource: (tableName) => {
                    if (tableName === 'Message' || tableName === 'MessageFile') return 'message'
                    return 'main'
                },
            },
        })

        const result = await filePlanner.prepareWhere({
            receipt: {
                OR: [{ user: { name_contains: 'john' } }],
            },
        })

        expect(result).toEqual({
            receipt: { id_in: ['msg-nested-1'] },
        })
    })

    test('rewrites empty positive relation _in groups to nested id_in []', async () => {
        getSchemaCtx.mockReturnValue({ keystone: {} })
        getItems.mockResolvedValueOnce([])

        const result = await planner.prepareWhere({
            user_in: [{ name_contains: 'missing' }],
        })

        expect(result).toEqual({ user: { id_in: [] } })
    })
})

describe('CrossDbPlanner._loadBaseIds', () => {
    let planner

    beforeEach(() => {
        jest.clearAllMocks()
        getItems.mockReset()
        getSchemaCtx.mockReset()
        getSchemaCtx.mockReturnValue({ keystone: {} })

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

    test('loads bounded base ids via getItems', async () => {
        getItems.mockResolvedValue([{ id: 'm-1' }, { id: 'm-2' }])

        await expect(planner._loadBaseIds({ status: 'sent' })).resolves.toEqual(['m-1', 'm-2'])
        expect(getItems).toHaveBeenCalledWith(expect.objectContaining({
            listKey: 'Message',
            where: { status: 'sent' },
            returnFields: 'id',
            sortBy: ['id_ASC'],
            first: 1000,
        }))
        expect(getItems.mock.calls[0][0]).not.toHaveProperty('skip')
    })

    test('paginates when a page is full (Keystone maxTotalResults)', async () => {
        getItems
            .mockResolvedValueOnce(Array.from({ length: 1000 }, (_, i) => ({ id: `m-${i}` })))
            .mockResolvedValueOnce([{ id: 'm-1000' }, { id: 'm-1001' }])

        const ids = await planner._loadBaseIds({ status: 'sent' })
        expect(ids).toHaveLength(1002)
        expect(getItems).toHaveBeenCalledTimes(2)
        expect(getItems).toHaveBeenNthCalledWith(2, expect.objectContaining({
            first: 1000,
            where: { AND: [{ status: 'sent' }, { id_gt: 'm-999' }] },
        }))
        expect(getItems.mock.calls[1][0]).not.toHaveProperty('skip')
    })

    test('throws when bounded base ids exceed hard limit', async () => {
        getItems.mockResolvedValue(Array.from({ length: 1000 }, (_, i) => ({ id: `m-${i}` })))

        // 51 full pages × 1000 = 51000 > 50000 hard limit
        await expect(planner._loadBaseIds({ status: 'sent' })).rejects.toThrow(
            'Cross-db OR flatten returned too many ids for Message. Limit: 50000'
        )
    })
})

describe('isUnsatisfiableWhere', () => {
    const { isUnsatisfiableWhere } = require('./planner')

    test('detects nested id_in []', () => {
        expect(isUnsatisfiableWhere({ user: { id_in: [] } })).toEqual(true)
    })

    test('detects top-level id_in []', () => {
        expect(isUnsatisfiableWhere({ id_in: [] })).toEqual(true)
    })

    test('returns false for non-empty id_in', () => {
        expect(isUnsatisfiableWhere({ user: { id_in: ['user-1'] } })).toEqual(false)
    })

    test('returns false for id_not_in []', () => {
        expect(isUnsatisfiableWhere({ user: { id_not_in: [] } })).toEqual(false)
    })

    test('returns false for empty id_in under user_not', () => {
        expect(isUnsatisfiableWhere({ user_not: { id_in: [] } })).toEqual(false)
    })

    test('detects empty id_in nested under AND', () => {
        expect(isUnsatisfiableWhere({ AND: [{ user: { id_in: [] } }] })).toEqual(true)
    })
})

describe('prepareCrossDbWhere', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getSchemaCtx.mockReturnValue({ keystone: {} })
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
