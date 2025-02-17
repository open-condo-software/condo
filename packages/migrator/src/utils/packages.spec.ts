import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'

import { faker } from '@faker-js/faker'

import { isNameMatching, findApps } from './packages'

import type { PackageInfoWithLocation } from './packages'
import type { Monorepo } from '@/utils/tests/repo'

import { createTestMonoRepo } from '@/utils/tests/repo'


function createTestPackageInfo (name: string): PackageInfoWithLocation {
    return {
        name,
        location: path.join(tmpdir(), 'apps', faker.random.alphaNumeric(10)),
    }
}

describe('Utils for detecting packages', () => {
    describe('isNameMatching', () => {
        test('Must return true if filter is not specified', () => {
            expect(isNameMatching(createTestPackageInfo('@app/condo'))).toEqual(true)
            expect(isNameMatching(createTestPackageInfo('condo'))).toEqual(true)
        })
        test('Must return false on empty filter', () => {
            expect(isNameMatching(createTestPackageInfo('@app/condo'), [])).toEqual(false)
            expect(isNameMatching(createTestPackageInfo('condo'), [])).toEqual(false)
        })
        test('Filter with scope must compare scopes as well', () => {
            expect(isNameMatching(createTestPackageInfo('@app/condo'), ['@scope/condo'])).toEqual(false)
            expect(isNameMatching(createTestPackageInfo('@app/condo'), ['@app/condo'])).toEqual(true)
            expect(isNameMatching(createTestPackageInfo('condo'), ['@app/condo'])).toEqual(false)
        })
        test('Filter without scope must omit scope while comparing', () => {
            expect(isNameMatching(createTestPackageInfo('@app/condo'), ['condo'])).toEqual(true)
            expect(isNameMatching(createTestPackageInfo('@scope/condo'), ['condo'])).toEqual(true)
            expect(isNameMatching(createTestPackageInfo('condo'), ['condo'])).toEqual(true)
        })
        test('Filtering is case-sensitive', () => {
            expect(isNameMatching(createTestPackageInfo('@app/CONDO'), ['condo'])).toEqual(false)
            // NOTE: scope is omitted
            expect(isNameMatching(createTestPackageInfo('@APP/condo'), ['condo'])).toEqual(true)
            expect(isNameMatching(createTestPackageInfo('@app/condo'), ['@APP/condo'])).toEqual(false)
        })
        test('Multiple filters combined with OR', () => {
            expect(isNameMatching(createTestPackageInfo('@app/condo'), ['@app/other', 'condo', '@app/service'])).toEqual(true)
        })
    })
    describe('Find apps', () => {
        let repo: Monorepo | undefined
        afterEach(() => {
            repo?.destroy()
        })
        test('Must find all @app/* packages from specified cwd', async () => {
            repo = createTestMonoRepo()
                .createApp()
                .createApp()
                .createApp()
                .createApp({ name: 'non-scoped-name' })

            const foundApps = await findApps({ cwd: repo.rootDir.name })
            expect(foundApps).toHaveLength(3)
            expect(foundApps).toEqual(
                expect.arrayContaining(
                    repo.apps
                        .filter(app => app.name.startsWith('@app/'))
                        .map(app => expect.objectContaining(app))
                )
            )
        })
        test('Must extract info about dependencies and devDependencies', async () => {
            const testDeps = { 'ioredis': '1.2.3', 'is-odd-ai': '^1.0.0' }
            const testDevDeps = { 'typescript': '^5' }

            repo = createTestMonoRepo()
                .createApp()
                .createApp({
                    dependencies: testDeps,
                })
                .createApp({
                    devDependencies: testDevDeps,
                })
                .createApp({
                    dependencies: testDeps,
                    devDependencies: testDevDeps,
                })

            expect(repo.apps[0]).not.toHaveProperty('dependencies')
            expect(repo.apps[0]).not.toHaveProperty('devDependencies')
            expect(repo.apps[1]).toHaveProperty('dependencies', testDeps)
            expect(repo.apps[1]).not.toHaveProperty('devDependencies')
            expect(repo.apps[2]).not.toHaveProperty('dependencies')
            expect(repo.apps[2]).toHaveProperty('devDependencies', testDevDeps)
            expect(repo.apps[3]).toHaveProperty('dependencies', testDeps)
            expect(repo.apps[3]).toHaveProperty('devDependencies', testDevDeps)

            const foundApps = await findApps({ cwd: repo.rootDir.name })
            expect(foundApps).toHaveLength(4)
            expect(foundApps).toEqual(
                expect.arrayContaining(
                    repo.apps
                        .filter(app => app.name.startsWith('@app/'))
                        .map(app => expect.objectContaining(app))
                )
            )
        })
        test('Must find single package if executed from it\'s folder', async () => {
            repo = createTestMonoRepo()
                .createApp({ name: '@app/first-app' })
                .createApp({ name: '@app/second-app' })

            const foundApps = await findApps({ cwd: path.dirname(repo.apps[0].location) })
            expect(foundApps).toHaveLength(1)
            expect(foundApps[0]).toEqual(expect.objectContaining(repo.apps[0]))
        })

        test('Must filter out non-valid JSONs', async () => {
            repo = createTestMonoRepo().createApp()
            fs.writeFileSync(repo.apps[0].location, JSON.stringify({
                noName: 'noName',
            }))

            const foundApps = await findApps({ cwd: repo.rootDir.name })
            expect(foundApps).toHaveLength(0)
        })
        describe('Must use process.cwd() as default cwd', () => {
            beforeEach(() => {
                jest.restoreAllMocks()
            })
            afterAll(() => {
                jest.restoreAllMocks()
            })
            test('Repo root case', async () => {
                repo = createTestMonoRepo()
                    .createApp()
                    .createApp()
                    .createApp()

                jest.spyOn(process, 'cwd').mockReturnValue(repo.rootDir.name)

                const foundApps = await findApps()

                expect(foundApps).toHaveLength(3)
                expect(foundApps).toEqual(
                    expect.arrayContaining(
                        repo.apps
                            .map(app => expect.objectContaining(app))
                    )
                )
            })
            test('App dir case', async () => {
                repo = createTestMonoRepo()
                    .createApp()
                    .createApp()
                    .createApp()


                jest.spyOn(process, 'cwd').mockReturnValue(path.dirname(repo.apps[1].location))

                const foundApps = await findApps()

                expect(foundApps).toHaveLength(1)
                expect(foundApps[0]).toEqual(
                    expect.objectContaining(repo.apps[1])
                )
            })
        })
    })
})