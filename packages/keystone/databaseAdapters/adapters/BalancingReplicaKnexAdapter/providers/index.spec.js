const { createSelectPlanner, getProviderCapabilities } = require('./index')

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

    test('returns redis stub planner and capabilities', () => {
        const planner = createSelectPlanner({ provider: 'redis' })
        const capabilities = getProviderCapabilities('redis')

        expect(planner).toBeDefined()
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
