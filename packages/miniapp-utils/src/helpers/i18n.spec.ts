import { TranslationsHelper } from './i18n'

import type { AcceptLanguageInfo } from './i18n'

describe('TranslationsHelper', () => {
    describe('static methods', () => {
        describe('parseLanguageString', () => {
            describe('must correctly detect locales', () => {
                const cases: Array<[string, AcceptLanguageInfo]> = [
                    ['en', { code: 'en', script: null, region: undefined, quality: 1.0 }],
                    ['ru', { code: 'ru', script: null, region: undefined, quality: 1.0 }],
                    ['es', { code: 'es', script: null, region: undefined, quality: 1.0 }],
                    ['en-GB', { code: 'en', script: null, region: 'GB', quality: 1.0 }],
                    ['en-US', { code: 'en', script: null, region: 'US', quality: 1.0 }],
                    ['ru-RU', { code: 'ru', script: null, region: 'RU', quality: 1.0 }],
                    ['zh-Hans-CN', { code: 'zh', script: 'Hans', region: 'CN', quality: 1.0 }],
                    ['en;q=0.8', { code: 'en', script: null, region: undefined, quality: 0.8 }],
                    ['en-US;q=0.9', { code: 'en', script: null, region: 'US', quality: 0.9 }],
                    ['zh-Hans-CN;q=0.55', { code: 'zh', script: 'Hans', region: 'CN', quality: 0.55 }],
                ]
                test.each(cases)('%p', (languageString, expectedResult) => {
                    const result = TranslationsHelper.parseLanguageString(languageString)
                    expect(result).toEqual(expectedResult)
                })
            })
        })
        describe('parseAcceptLanguageHeader', () => {
            describe('must correctly parse correct accept-headers', () => {
                const cases: Array<[string, Array<AcceptLanguageInfo>]> = [
                    ['*', [{ code: '*', script: null, region: undefined, quality: 1.0 }]],
                    ['en', [{ code: 'en', script: null, region: undefined, quality: 1.0 }]],
                    ['ru-RU', [{ code: 'ru', script: null, region: 'RU', quality: 1.0 }]],
                    ['en-GB,en-US;q=0.9,en;q=0.8', [
                        { code: 'en', script: null, region: 'GB', quality: 1.0 },
                        { code: 'en', script: null, region: 'US', quality: 0.9 },
                        { code: 'en', script: null, region: undefined, quality: 0.8 },
                    ]],
                ]
                test.each(cases)('%p', (headerValue, expectedResult) => {
                    const result = TranslationsHelper.parseAcceptLanguageHeader(headerValue)
                    expect(result).toEqual(expectedResult)
                })
            })
            test('undefined header must be read as "*" (accept-all) header', () => {
                expect(TranslationsHelper.parseAcceptLanguageHeader(undefined)).toEqual([
                    {
                        code: '*',
                        script: null,
                        region: undefined,
                        quality: 1.0,
                    },
                ])
            })
            test('must sort languages by quality descending', () => {
                expect(TranslationsHelper.parseAcceptLanguageHeader('en;q=0.8,en-US;q=0.9,en-GB')).toEqual([
                    { code: 'en', script: null, region: 'GB', quality: 1.0 },
                    { code: 'en', script: null, region: 'US', quality: 0.9 },
                    { code: 'en', script: null, region: undefined, quality: 0.8 },
                ])
            })
        })
    })
})