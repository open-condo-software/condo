const { faker } = require('@faker-js/faker')

const { BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE } = require('@condo/domains/notification/constants/constants')
const { WRONG_MESSAGE_TYPE_PROVIDED_ERROR } = require('@condo/domains/notification/constants/errors')

const { fillDataByMessageTypeMeta, renderTemplateString, hydrateItems } = require('./messageTools')

describe('messageTools', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('renderTemplateString', () => {
        it('properly fills template strings with corresponding values', async () => {
            const template = ['{a}', '{b}', '{c}'].join(':')
            const data = {
                a: faker.random.alphaNumeric(8),
                b: faker.datatype.number(),
                c: faker.datatype.uuid(),
            }
            const result = renderTemplateString(template, data)

            expect(result).toEqual([data.a, data.b, data.c].join(':'))
        })

        it('properly fills comlex template strings with corresponding values', async () => {
            const template = ['xxx/{a}/{b}/{c}/zzz', '{b}/yyy/{c}', 'xxx{c}zzz'].join(':')
            const data = {
                a: faker.random.alphaNumeric(8),
                b: faker.datatype.number(),
                c: faker.datatype.uuid(),
            }
            const result = renderTemplateString(template, data)
            const expectedResult = [`xxx/${data.a}/${data.b}/${data.c}/zzz`, `${data.b}/yyy/${data.c}`, `xxx${data.c}zzz`].join(':')

            expect(result).toEqual(expectedResult)
        })

        it('skips template parts having no corresponding data keys', async () => {
            const template = ['{a}', '{d}', '{c}'].join(':')
            const data = {
                a: faker.random.alphaNumeric(8),
                b: faker.datatype.number(),
                c: faker.datatype.uuid(),
            }
            const result = renderTemplateString(template, data)

            expect(result).toEqual([data.a, '{d}', data.c].join(':'))
        })

        it('skips template parts having ReDoS pattern key', async () => {
            const template = '^a+a+$' // template with ReDoS exploit
            // data with ReDoS exploit
            const data = {
                '^a+a+$': faker.random.alphaNumeric(8),
            }
            const result = renderTemplateString(template, data)

            // no data should be populated
            // since reg exp wasn't run by function - cause data key has ReDoS exploit
            // expected original template
            expect(result).toEqual(template)
        })
    })

    describe('hydrateItems', () => {
        it('properly fills template strings within meta with corresponding values', async () => {
            const meta = {
                url: ['xxx', '{residentId}', '{categoryId}', 'zzz'].join('/'),
                categoryId: faker.datatype.uuid(),
            }
            const extraData = {
                residentId: faker.datatype.uuid(),
            }
            const result = hydrateItems(meta, extraData)

            expect(result.url).toEqual(['xxx', extraData.residentId, meta.categoryId, 'zzz'].join('/'))
        })

        it('properly fills multiple key occurrence within template string with corresponding values', async () => {
            const meta = {
                url: ['xxx', '{residentId}', '{categoryId}', '{residentId}', '{categoryId}', '{residentId}', '{categoryId}', 'zzz'].join('/'),
                categoryId: faker.datatype.uuid(),
            }
            const extraData = {
                residentId: faker.datatype.uuid(),
            }
            const result = hydrateItems(meta, extraData)

            expect(result.url).toEqual(['xxx', extraData.residentId, meta.categoryId, extraData.residentId, meta.categoryId, extraData.residentId, meta.categoryId, 'zzz'].join('/'))
        })


        it('leaves template parts intact for missing keys', async () => {
            const meta = {
                url: ['xxx', '{residentId}', '{categoryId}', '{organizationId}', 'zzz'].join('/'),
                categoryId: faker.datatype.uuid(),
            }
            const extraData = {
                residentId: faker.datatype.uuid(),
            }
            const result = hydrateItems(meta, extraData)

            expect(result.url).toEqual(['xxx', extraData.residentId, meta.categoryId, '{organizationId}', 'zzz'].join('/'))
        })

        it('removes parts for empty/nullish keys', async () => {
            const meta = {
                url: ['xxx', '{residentId}', '{categoryId}', '{organizationId}', 'zzz'].join('/'),
                categoryId: faker.datatype.uuid(),
            }
            const extraData = {
                residentId: faker.datatype.uuid(),
                organizationId: '',
            }
            const result = hydrateItems(meta, extraData)

            expect(result.url).toEqual(['xxx', extraData.residentId, meta.categoryId, '', 'zzz'].join('/'))
        })
    })

    describe('fillDataByMessageTypeMeta', () => {
        it('properly fills payload from meta according to notification type settings', async () => {
            const meta = {
                categoryName: faker.random.alphaNumeric(8),
                excessField: faker.random.alphaNumeric(8),
            }
            const result = fillDataByMessageTypeMeta(BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE, meta)

            expect(result.categoryName).toEqual(meta.categoryName)
            expect(result.excessField).toBeUndefined()
        })

        it('properly fills payload from meta nested fields according to notification type settings', async () => {
            const meta = {
                categoryName: faker.random.alphaNumeric(8),
                excessField: faker.random.alphaNumeric(8),
                data: {
                    url: ['xxx', '{residentId}', '{categoryId}', 'zzz'].join('/'),
                    categoryId: faker.datatype.uuid(),
                    userId: faker.datatype.uuid(),
                    residentId: faker.datatype.uuid(),
                    excessField: faker.random.alphaNumeric(8),
                },
            }
            const data = fillDataByMessageTypeMeta(BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE, meta.data, ['data'])
            const result = fillDataByMessageTypeMeta(BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE, { ...meta, data })

            expect(result.categoryName).toEqual(meta.categoryName)
            expect(result.excessField).toBeUndefined()
            expect(result.data.url).toEqual(meta.data.url)
            expect(result.data.categoryId).toEqual(meta.data.categoryId)
            expect(result.data.userId).toEqual(meta.data.userId)
            expect(result.data.residentId).toEqual(meta.data.residentId)
            expect(result.data.excessField).toBeUndefined()
        })

        it('throws on wrong message type', () => {
            const meta = {}
            const type = faker.random.alphaNumeric(8)
            const t = () => { fillDataByMessageTypeMeta(type, meta) }

            expect(t).toThrow(Error)
            expect(t).toThrow(`${WRONG_MESSAGE_TYPE_PROVIDED_ERROR}: ${type}`)
        })
    })
})