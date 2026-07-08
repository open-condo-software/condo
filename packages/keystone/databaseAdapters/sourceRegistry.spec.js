const {
    createSourceRegistry,
    getSourceRegistryConfig,
    isCrossDbPlannerEnabled,
} = require('./sourceRegistry')

describe('source registry', () => {
    test('parses plain JSON config', () => {
        const config = getSourceRegistryConfig(JSON.stringify({
            defaultSource: 'main',
            sourceByTable: { User: 'users_master' },
        }))

        expect(config).toEqual({
            defaultSource: 'main',
            sourceByTable: { User: 'users_master' },
        })
    })

    test('parses custom-prefixed config', () => {
        const config = getSourceRegistryConfig(`custom:${JSON.stringify({
            defaultSource: 'main',
            sourceByTable: { Message: 'messages_cluster' },
        })}`)

        expect(config.sourceByTable.Message).toEqual('messages_cluster')
    })

    test('resolves source by table and fallback to default', () => {
        const registry = createSourceRegistry({
            defaultSource: 'default',
            sourceByTable: { User: 'users_db' },
        })

        expect(registry.resolveSource('User')).toEqual('users_db')
        expect(registry.resolveSource('Ticket')).toEqual('default')
    })

    test('enables planner only for explicit true', () => {
        expect(isCrossDbPlannerEnabled('true')).toEqual(true)
        expect(isCrossDbPlannerEnabled('false')).toEqual(false)
        expect(isCrossDbPlannerEnabled(undefined)).toEqual(false)
    })
})
