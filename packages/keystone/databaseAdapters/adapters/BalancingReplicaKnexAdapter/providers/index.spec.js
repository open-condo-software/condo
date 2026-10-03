const { createDataProvider, createSelectPlanner, getProviderCapabilities } = require('./index')

describe('provider capabilities', () => {
    test('returns postgres planner and capabilities by default', () => {
        const planner = createSelectPlanner({})
        const capabilities = getProviderCapabilities()

        expect(planner).toBeDefined()
        expect(typeof planner.canPlan).toBe('function')
        expect(typeof planner.canPlanMutation).toBe('function')
        expect(typeof planner.planMutation).toBe('function')
        expect(capabilities).toEqual(expect.objectContaining({
            provider: 'postgres',
            supportsSqlRouting: true,
            supportsCrossSourceSelectPlanning: true,
            supportsCrossSourceMutationPlanning: false,
        }))
    })

    test('returns redis data provider with find-by-id support only', () => {
        const planner = createSelectPlanner({ provider: 'redis' })
        const dataProvider = createDataProvider({ provider: 'redis' })
        const capabilities = getProviderCapabilities('redis')

        expect(planner).toBeDefined()
        expect(dataProvider).toBeDefined()
        expect(dataProvider.supportsFind({ condition: { id: 'u1' } })).toBe(true)
        expect(dataProvider.supportsFind({ condition: { name_contains: 'x' } })).toBe(false)
        expect(dataProvider.supportsItemsQuery()).toBe(false)
        expect(dataProvider.supportsCreate()).toBe(false)
        expect(dataProvider.supportsUpdate()).toBe(false)
        expect(dataProvider.supportsDelete()).toBe(false)
        expect(planner.canPlan({ sqlOperationName: 'select' })).toBe(false)
        expect(planner.canPlanMutation({ sqlOperationName: 'update' })).toBe(false)
        expect(capabilities).toEqual(expect.objectContaining({
            provider: 'redis',
            supportsSqlRouting: false,
            supportsCrossSourceSelectPlanning: false,
            supportsCrossSourceMutationPlanning: false,
        }))
    })
})
