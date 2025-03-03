import { isAppUsingKV } from './filtering'

import type { Monorepo } from '@/utils/tests/repo'

import { createTestMonoRepo } from '@/utils/tests/repo'

describe('Utils for filtering specific packages', () => {
    let repo: Monorepo | undefined
    afterEach(() => {
        repo?.destroy()
    })
    
    describe('isAppUsingKV', () => {
        test('Must return "true" if "@open-condo/keystone" or "ioredis" found in package dependencies / devDependencies', () => {
            repo = createTestMonoRepo()
                .createApp({ dependencies: { 'ioredis': '^4.28.5' } })
                .createApp({ dependencies: { '@open-condo/keystone': 'workspace:^' } })
                .createApp({ devDependencies: { 'ioredis': '^4.28.5' } })
                .createApp({ devDependencies: { '@open-condo/keystone': 'workspace:^' } })

            const detectedApps = repo.apps.filter(isAppUsingKV)
            expect(detectedApps).toHaveLength(repo.apps.length)
        })
        test('Must return "false" if dependencies / devDependencies are empty or not containing "@open-condo/keystone" or "ioredis" package', () => {
            repo = createTestMonoRepo()
                .createApp()
                .createApp({ dependencies: { '@open-condo/ui': 'workspace:^' } })
                .createApp({ devDependencies: { '@open-condo/tsconfig': 'workspace:^' } })
                .createApp({ devDependencies: { '@open-condo/tsconfig': 'workspace:^' }, dependencies: { '@open-condo/ui': 'workspace:^' } })

            const detectedApps = repo.apps.filter(isAppUsingKV)
            expect(detectedApps).toHaveLength(0)
        })
    })
})