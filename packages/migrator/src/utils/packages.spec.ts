import { tmpdir } from 'os'
import path from 'path'

import { faker } from '@faker-js/faker'

import { isNameMatching } from './packages'

import type { PackageInfoWithLocation } from './packages'

function createTestPackageInfo (name: string): PackageInfoWithLocation {
    return {
        name,
        location: path.join(tmpdir(), 'apps', faker.random.alphaNumeric(10)),
    }
}

describe('Utils for working packages', () => {
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
})