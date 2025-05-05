import { TranslationsHelper } from './i18n'

import type { AcceptLanguageInfo } from './i18n'

describe('TranslationsHelper', () => {
    describe('static methods', () => {
        describe('parseLanguageString', () => {
            describe('must correctly detect locales', () => {
                const cases: Array<[string, AcceptLanguageInfo]> = [
                    // Simple cases
                    ['en', { primary: 'en', extended: undefined, script: undefined, region: undefined, quality: 1.0 }],
                    ['ru', { primary: 'ru', extended: undefined, script: undefined, region: undefined, quality: 1.0 }],
                    ['es', { primary: 'es', extended: undefined, script: undefined, region: undefined, quality: 1.0 }],
                    // Region cases
                    ['en-GB', { primary: 'en', extended: undefined, script: undefined, region: 'GB', quality: 1.0 }],
                    ['en-US', { primary: 'en', extended: undefined, script: undefined, region: 'US', quality: 1.0 }],
                    ['ru-RU', { primary: 'ru', extended: undefined, script: undefined, region: 'RU', quality: 1.0 }],
                    ['es-419', { primary: 'es', extended: undefined, script: undefined, region: '419', quality: 1.0 }],
                    // Script cases
                    ['sr-Latn', { primary: 'sr', extended: undefined, script: 'Latn', region: undefined, quality: 1.0 }],
                    ['sr-Cyrl', { primary: 'sr', extended: undefined, script: 'Cyrl', region: undefined, quality: 1.0 }],
                    // Script + region cases
                    ['sr-Latn-RS', { primary: 'sr', extended: undefined, script: 'Latn', region: 'RS', quality: 1.0 }],
                    ['az-Arab-IR', { primary: 'az', extended: undefined, script: 'Arab', region: 'IR', quality: 1.0 }],
                    ['zh-Hans-CN', { primary: 'zh', extended: undefined, script: 'Hans', region: 'CN', quality: 1.0 }],
                    ['zh-Hant-TW', { primary: 'zh', extended: undefined, script: 'Hant', region: 'TW', quality: 1.0 }],
                    // Primary + extended cases
                    ['zh-gan', { primary: 'zh', extended: 'gan', script: undefined, region: undefined, quality: 1.0 }],
                    ['zh-cmn', { primary: 'zh', extended: 'cmn', script: undefined, region: undefined, quality: 1.0 }],
                    // All combined
                    ['zh-cmn-Hans-CN', { primary: 'zh', extended: 'cmn', script: 'Hans', region: 'CN', quality: 1.0 }],
                    ['zh-cmn-Hans-CN;q=0.8', { primary: 'zh', extended: 'cmn', script: 'Hans', region: 'CN', quality: 0.8 }],
                    // Custom quantity cases
                    ['en-GB;q=0.85', { primary: 'en', extended: undefined, script: undefined, region: 'GB', quality: 0.85 }],
                    ['en-US;q=0.5', { primary: 'en', extended: undefined, script: undefined, region: 'US', quality: 0.5 }],
                ]
                test.each(cases)('%p', (localeString, expectedResult) => {
                    const result = TranslationsHelper.parseLocaleString(localeString)
                    expect(result).toEqual(expectedResult)
                })
            })
        })
        describe('parseAcceptLanguageHeader', () => {
            describe('must correctly parse correct accept-headers', () => {
                const cases: Array<[string, Array<AcceptLanguageInfo>]> = [
                    ['*', [{ primary: '*', extended: undefined, script: undefined, region: undefined, quality: 1.0 }]],
                    ['en', [{ primary: 'en', extended: undefined, script: undefined, region: undefined, quality: 1.0 }]],
                    ['ru-RU', [{ primary: 'ru', extended: undefined, script: undefined, region: 'RU', quality: 1.0 }]],
                    ['en-GB,en-US;q=0.9,en;q=0.8', [
                        { primary: 'en', extended: undefined, script: undefined, region: 'GB', quality: 1.0 },
                        { primary: 'en', extended: undefined, script: undefined, region: 'US', quality: 0.9 },
                        { primary: 'en', extended: undefined, script: undefined, region: undefined, quality: 0.8 },
                    ]],
                    ['zh-Hans-CN,zh-Hant-TW;q=0.8,zh;q=0.7,en;q=0.5', [
                        { primary: 'zh', extended: undefined, script: 'Hans', region: 'CN', quality: 1.0 },
                        { primary: 'zh', extended: undefined, script: 'Hant', region: 'TW', quality: 0.8 },
                        { primary: 'zh', extended: undefined, script: undefined, region: undefined, quality: 0.7 },
                        { primary: 'en', extended: undefined, script: undefined, region: undefined, quality: 0.5 },
                    ]],
                    ['fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5', [
                        { primary: 'fr', extended: undefined, script: undefined, region: 'CH', quality: 1.0 },
                        { primary: 'fr', extended: undefined, script: undefined, region: undefined, quality: 0.9 },
                        { primary: 'en', extended: undefined, script: undefined, region: undefined, quality: 0.8 },
                        { primary: 'de', extended: undefined, script: undefined, region: undefined, quality: 0.7 },
                        { primary: '*', extended: undefined, script: undefined, region: undefined, quality: 0.5 },
                    ]],
                ]
                test.each(cases)('%p', (headerValue, expectedResult) => {
                    const result = TranslationsHelper.parseAcceptLanguageHeader(headerValue)
                    expect(result).toEqual(expectedResult)
                })
            })
            test('undefined header must be read as "*" (accept-all) header', () => {
                expect(TranslationsHelper.parseAcceptLanguageHeader(undefined)).toEqual([
                    { primary: '*', extended: undefined, script: undefined, region: undefined, quality: 1.0 },
                ])
            })
            test('must sort languages by quality descending', () => {
                expect(TranslationsHelper.parseAcceptLanguageHeader('en;q=0.8,en-US;q=0.9,en-GB')).toEqual([
                    { primary: 'en', extended: undefined, script: undefined, region: 'GB', quality: 1.0 },
                    { primary: 'en', extended: undefined, script: undefined, region: 'US', quality: 0.9 },
                    { primary: 'en', extended: undefined, script: undefined, region: undefined, quality: 0.8 },
                ])
            })
        })
        describe('toLocaleString', () => {
            describe('Must generate valid to RFC5646 strings', () => {
                test('Must keep the correct order', () => {
                    expect(TranslationsHelper.toLocaleString({
                        region: 'CN',
                        extended: 'cmn',
                        script: 'Hans',
                        primary: 'zh',
                    })).toEqual('zh-cmn-Hans-CN')
                })
                test('Must omit undefined parts', () => {
                    expect(TranslationsHelper.toLocaleString({
                        primary: 'en',
                        extended: undefined,
                        script: undefined,
                        region: undefined,
                    })).toEqual('en')
                    expect(TranslationsHelper.toLocaleString({
                        primary: 'ru',
                        extended: undefined,
                        script: undefined,
                        region: 'RU',
                    })).toEqual('ru-RU')
                })
                test('Must ignore quality if input is AcceptLanguageInfo', () => {
                    expect(TranslationsHelper.toLocaleString({
                        primary: 'ru',
                        extended: undefined,
                        script: undefined,
                        region: 'RU',
                        quality: 0.5,
                    })).toEqual('ru-RU')
                })
            })
        })
    })
    describe('instance methods', () => {
        describe('selectSupportedLocale', () => {
            describe('Must select most suitable locale from available ones', () => {
                const cases: Array<[Array<string>, string, string, string]> = [
                    // Simple case
                    [['en', 'es', 'ru'], 'ru,en;q=0.9', 'ru', 'ru'],
                    // Fallback case
                    [['en', 'es', 'ru'], 'zh', 'en', 'en'],
                    // Different match case
                    [['en', 'es', 'ru'], 'en-GB,en-US;q=0.9,en;q=0.8', 'en', 'en-GB'],
                    // Partial match case
                    [['en', 'zh-Hans', 'zh'], 'zh-Hans-CN', 'zh-Hans', 'zh-Hans-CN'],
                    [['en', 'zh-Hans', 'zh'], 'zh-Hant-TW', 'zh', 'zh-Hant-TW'],
                ]

                test.each(cases)('Available: %p, requesting: %p', (locales, requestedLocales, expectedSelection, expectedFull) => {
                    const fakeLoader = async () => ({})
                    const helper = new TranslationsHelper({
                        locales,
                        defaultLocale: locales[0],
                        loadDefaultMessages: fakeLoader,
                        loadMessages: fakeLoader,
                    })
                    const { selectedLocale, fullLocale } = helper.selectSupportedLocale(TranslationsHelper.parseAcceptLanguageHeader(requestedLocales))
                    expect(selectedLocale).toEqual(expectedSelection)
                    expect(fullLocale).toEqual(expectedFull)
                })
            })
        })
    })
})