/**
 * @jest-environment node
 */

const { makeClient, setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))
const faker = require('faker')
const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')
const { makeLoggedInClient } = require('@core/keystone/test.utils')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { isMongo } = require('@core/keystone/test.utils')
const { UUID_RE, DATETIME_RE } = require('@core/keystone/test.utils')

const TEST_FIELDS = '{ id v text meta createdAt updatedAt createdBy { id } updatedBy { id } }'
const TEST_ITEM_FIELDS = `{ id v meta test ${TEST_FIELDS} }`
const Test = genTestGQLUtils('Test', TEST_FIELDS)
const TestItem = genTestGQLUtils('TestItem', TEST_ITEM_FIELDS)

const TEST_HISTORY_FIELDS = '{ id v text history_id history_action history_date }'
const TEST_ITEM_HISTORY_FIELDS = '{ id v meta test history_id history_action history_date }'
const TestHistoryRecord = genTestGQLUtils('TestHistoryRecord', TEST_HISTORY_FIELDS)
const TestItemHistoryRecord = genTestGQLUtils('TestItemHistoryRecord', TEST_ITEM_HISTORY_FIELDS)

const TEST_SOFT_DELETED_FIELDS = '{ id v meta deletedAt }'
const TestSoftDeletedObj = genTestGQLUtils('TestSoftDeletedObj', TEST_SOFT_DELETED_FIELDS)

const TestAutoIncrementNumber = genTestGQLUtils('TestAutoIncrementNumber', '{ id number }')

describe('Json field', () => {
    async function testJsonValue (value) {
        const client = await makeClient()
        let obj = await Test.create(client, { meta: value })
        expect(obj.meta).toStrictEqual(value)
    }

    test('object as value', async () => {
        await testJsonValue({ foo: 'foo', bar: 2, buz: false, no: null, yes: true })
    })
    test('object with array as value', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: {} === null!')

        await testJsonValue({
            foo: ['foo', 1, 33.3],
            bar: 2,
            buz: false,
            no: [null, false],
            yes: true,
            e1: [],
            e2: {},
        })
    })
    test('{} as value', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: {} === null!')
        await testJsonValue({})
    })
    test('null as value', async () => {
        await testJsonValue(null)
    })
    test('true as value', async () => {
        await testJsonValue(true)
    })
    test('false as value', async () => {
        await testJsonValue(false)
    })
    test('"" as value', async () => {
        await testJsonValue('')
    })
    test('[] as value', async () => {
        await testJsonValue([])
    })
    test('0 as value', async () => {
        await testJsonValue(0)
    })
    test('{"":[{}]} as value', async () => {
        await testJsonValue({ '': [{}] })
        await testJsonValue({ '': [{ '': [{}] }] })
    })
    test('number as value', async () => {
        await testJsonValue(faker.random.number())
        await testJsonValue(faker.random.float())
    })
    test('string as value', async () => {
        await testJsonValue(faker.internet.email())
        await testJsonValue(JSON.stringify(JSON.stringify(faker.internet.email())))
        await testJsonValue('\'')
        await testJsonValue('"')
        await testJsonValue('--')
        await testJsonValue('%')
        await testJsonValue('~')
        await testJsonValue('~~')
    })
    test('array as value', async () => {
        await testJsonValue(faker.random.arrayElements())
    })
})

describe('Json field exact match filter', () => {
    async function testFilterByValue (value, metaSuffix = '') {
        // NOTE: the test may fail by access denied to createdBy { id } field!
        const client = await makeLoggedInClient()
        const obj = await Test.create(client, { meta: value })
        const objs = await Test.getAll(client, { ['meta' + metaSuffix]: value })
        const objsIds = objs.map(x => x.id)
        const objsMetas = [...(new Set(objs.map(x => JSON.stringify(x.meta))))].map(JSON.parse)
        expect(objsIds).toContain(obj.id)
        expect(objsMetas).toStrictEqual([value])
    }

    test('object as value', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: need a custom query parser!')

        await testFilterByValue({ foo: 'foo', bar: 2, buz: false, no: null, yes: true })
        // await testFilterByValue({ foo: 'foo', bar: 2, buz: false, no: null, yes: true }, '_in') // ok
    })
    test('object with array as value', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: need a custom query parser!')

        await testFilterByValue({
            foo: ['foo', 1, 33.3],
            bar: 2,
            buz: false,
            no: [null, false],
            yes: true,
            e1: [],
            e2: {},
        })
        // await testFilterByValue({
        //         foo: ['foo', 1, 33.3],
        //         bar: 2,
        //         buz: false,
        //         no: [null, false],
        //         yes: true,
        //         e1: [],
        //         e2: {},
        //     },
        //     '_in',
        // ) // ok
    })
    test('{} as value', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: {} === null!')

        await testFilterByValue({})
        // await testFilterByValue({}, '_in') // ok
    })
    test('null as value', async () => {
        await testFilterByValue(null)
        // await testFilterByValue(null, '_in') // err
    })
    test('true as value', async () => {
        await testFilterByValue(true)
        // await testFilterByValue(true, '_in') // err
    })
    test('false as value', async () => {
        await testFilterByValue(false)
        // await testFilterByValue(false, '_in') // ok
    })
    test('by ""', async () => {
        await testFilterByValue('')
        // await testFilterByValue('', '_in') // ok
    })
    test('by []', async () => {
        await testFilterByValue([])
        // await testFilterByValue([], '_in') // err
    })
    test('by 0', async () => {
        await testFilterByValue(0)
    })
    test('by {"":[{}]}', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: {} === null!')

        await testFilterByValue({ '': [{}] })
        await testFilterByValue({ '': [{ '': [{}] }] })
    })
    test('by number', async () => {
        await testFilterByValue(faker.random.number())
        await testFilterByValue(faker.random.float())
    })
    test('by string', async () => {
        await testFilterByValue(faker.internet.email())
        await testFilterByValue(JSON.stringify(JSON.stringify(faker.internet.email())))
        await testFilterByValue('\'')
        await testFilterByValue('"')
        await testFilterByValue('--')
        await testFilterByValue('%')
        await testFilterByValue('~')
        await testFilterByValue('~~')
    })
    test('by array', async () => {
        await testFilterByValue(faker.random.arrayElements())
    })
})

describe('historical()', () => {
    test('create/update/delete history', async () => {
        const client = await makeClient()
        let obj = await Test.create(client, {})
        await Test.update(client, obj.id, { text: 'hello' })
        await Test.update(client, obj.id, { text: 'no' })
        await Test.delete(client, obj.id)

        let histObjs = await TestHistoryRecord.getAll(client, { history_id: obj.id })
        expect(histObjs).toEqual([
            expect.objectContaining({ history_action: 'c', history_id: obj.id, text: null, v: 1 }),
            expect.objectContaining({ history_action: 'u', history_id: obj.id, text: 'hello', v: 2 }),
            expect.objectContaining({ history_action: 'u', history_id: obj.id, text: 'no', v: 3 }),
            expect.objectContaining({ history_action: 'd', history_id: obj.id, text: 'no', v: 3 }),
        ])
    })

    test('delete related object and set FK null without history update', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: doesn\'t support UUID fk!')
        const client = await makeClient()
        let obj = await TestItem.create(client, { test: { create: { text: 'new1' } }, meta: { foo: 1 } })
        await TestItem.update(client, obj.id, { meta: { foo: 2 } })
        await Test.update(client, obj.test.id, { text: 'new2' })
        await Test.delete(client, obj.test.id)
        await TestItem.delete(client, obj.id)

        let histObjs = await TestHistoryRecord.getAll(client, { history_id: obj.test.id })
        expect(histObjs).toEqual([
            expect.objectContaining({ history_action: 'c', history_id: obj.test.id, text: 'new1', v: 1 }),
            expect.objectContaining({ history_action: 'u', history_id: obj.test.id, text: 'new2', v: 2 }),
            expect.objectContaining({ history_action: 'd', history_id: obj.test.id, text: 'new2', v: 2 }),
        ])

        histObjs = await TestItemHistoryRecord.getAll(client, { history_id: obj.id })
        expect(histObjs).toEqual([
            expect.objectContaining({
                history_action: 'c',
                history_id: obj.id,
                meta: { foo: 1 },
                v: 1,
                test: String(obj.test.id),
            }),
            expect.objectContaining({
                history_action: 'u',
                history_id: obj.id,
                meta: { foo: 2 },
                v: 2,
                test: String(obj.test.id),
            }),
            expect.objectContaining({
                history_action: 'd',
                history_id: obj.id,
                meta: { foo: 2 },
                v: 2,
                test: null,
            }),
        ])
    })
})

describe('versioned()', () => {
    test('check v field autoincrement', async () => {
        const client = await makeClient()

        let obj = await Test.create(client, {})
        expect(obj.v).toBe(1)

        obj = await Test.update(client, obj.id, { text: 'hello' })
        expect(obj.v).toBe(2)
    })
    test('try to set v', async () => {
        const admin = await makeLoggedInAdminClient()
        const { data, errors } = await Test.create(admin, { v: 5 }, { raw: true })
        expect(data).toEqual(undefined)
        expect(JSON.stringify(errors)).toMatch(/Field [\\"']+v[\\"']+ is not defined by type [\\"']+TestCreateInput[\\"']+/i)
    })
})

describe('uuided()', () => {
    test('chek id field is uuid', async () => {
        const client = await makeClient()
        let obj = await TestItem.create(client, { test: { create: { text: 'autoGen' } } })
        expect(obj.id).toMatch(UUID_RE)
    })
})

describe('tracked()', () => {
    test('check createAt/updateAt for anonymous', async () => {
        const client = await makeClient()
        let { id, createdAt, updatedAt } = await Test.create(client, {})
        expect(createdAt).toMatch(DATETIME_RE)
        expect(updatedAt).toMatch(DATETIME_RE)
        expect(updatedAt).toEqual(createdAt)
        let obj = await Test.update(client, id, { text: 'new' })
        expect(obj.createdAt).toEqual(createdAt)
        expect(obj.updatedAt).toMatch(DATETIME_RE)
        expect(obj.updatedAt).not.toEqual(createdAt)
    })
    test('check createBy/updateBy for anonymous', async () => {
        const client = await makeClient()
        let { id, createdBy, updatedBy } = await Test.create(client, {})
        expect(createdBy).toBe(null)
        expect(updatedBy).toBe(null)
        let obj = await Test.update(client, id, { text: 'new' })
        expect(obj.createdBy).toBe(null)
        expect(obj.updatedBy).toBe(null)
    })
    test('check createBy/updateBy for user1/user2', async () => {
        const client = await makeLoggedInClient()
        const admin = await makeLoggedInAdminClient()
        let { id, createdBy, updatedBy } = await Test.create(client, {})
        expect(createdBy).toEqual({ id: client.user.id })
        expect(updatedBy).toEqual({ id: client.user.id })
        let obj = await Test.update(admin, id, { text: 'new' })
        expect(obj.createdBy).toEqual({ id: client.user.id })
        expect(obj.updatedBy).toEqual({ id: admin.user.id })
    })
    test('try to set createBy', async () => {
        const client = await makeLoggedInClient()
        const admin = await makeLoggedInAdminClient()
        const { data, errors } = await Test.create(client, { createdBy: { connect: { id: admin.user.id } } }, { raw: true })
        expect(data).toEqual(undefined)
        expect(JSON.stringify(errors)).toMatch(/Field [\\"']+createdBy[\\"']+ is not defined by type [\\"']+TestCreateInput[\\"']+/i)
    })
})

describe('softDeleted()', () => {
    test('check deletedAt is auto generated and accept any string', async () => {
        const client = await makeClient()
        let obj = await TestSoftDeletedObj.create(client)
        obj = await TestSoftDeletedObj.update(client, obj.id, { deletedAt: 'true' })
        expect(obj.deletedAt).toMatch(DATETIME_RE)
    })
    test('check delete after delete', async () => {
        const client = await makeClient()
        let obj = await TestSoftDeletedObj.create(client)
        obj = await TestSoftDeletedObj.update(client, obj.id, { deletedAt: 'true' })
        const { errors } = await TestSoftDeletedObj.update(client, obj.id, { deletedAt: new Date().toISOString() }, { raw: true })
        expect(errors[0]).toMatchObject({
            'message': 'Already deleted',
            'name': 'GraphQLError',
        })
    })
    test('check update after delete', async () => {
        const client = await makeClient()
        let obj = await TestSoftDeletedObj.create(client)
        obj = await TestSoftDeletedObj.update(client, obj.id, { deletedAt: 'true' })
        const { errors } = await TestSoftDeletedObj.update(client, obj.id, { meta: { foo: 1 } }, { raw: true })
        expect(errors[0]).toMatchObject({
            'message': 'Already deleted',
            'name': 'GraphQLError',
        })
    })
    test('check create deleted obj', async () => {
        const client = await makeClient()
        const { errors } = await TestSoftDeletedObj.create(client, { deletedAt: 'true' }, { raw: true })
        expect(errors[0]).toMatchObject({
            'message': 'Variable "$data" got invalid value { deletedAt: "true" }; Field "deletedAt" is not defined by type "TestSoftDeletedObjCreateInput".',
            'name': 'GraphQLError',
        })
    })
    test('check disallow to hard delete', async () => {
        const client = await makeLoggedInAdminClient()
        let obj = await TestSoftDeletedObj.create(client)
        const { errors } = await TestSoftDeletedObj.delete(client, obj.id, { raw: true })
        expect(errors[0]).toMatchObject({
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
        })
    })
    test('check filter by default deletedAt = null', async () => {
        const client = await makeLoggedInAdminClient()
        const rand = faker.random.number()
        let obj1 = await TestSoftDeletedObj.create(client, { meta: { rand } })
        let obj2 = await TestSoftDeletedObj.create(client, { meta: { rand } })

        await TestSoftDeletedObj.update(client, obj1.id, { deletedAt: 'true' })

        const objs = await TestSoftDeletedObj.getAll(client, { meta_in: [{ rand }] })
        expect(objs.map(x => x.id)).toEqual([obj2.id])
    })
    test('check filter by default newId = null', async () => {
        const client = await makeLoggedInAdminClient()
        const rand = faker.random.number()
        let obj1 = await TestSoftDeletedObj.create(client, { meta: { rand } })
        let obj2 = await TestSoftDeletedObj.create(client, { meta: { rand } })

        await TestSoftDeletedObj.update(client, obj1.id, { newId: obj2.id })

        let objs = await TestSoftDeletedObj.getAll(client, { meta_in: [{ rand }] })
        expect(objs.map(x => x.id)).toEqual([obj2.id])
    })
})

describe('TestAutoIncrementNumber field', () => {
    if (isMongo()) return console.error('SKIP() Mongo: Need to implement AutoIncrementIntegerMongooseFieldAdapter!')

    test('generate incremental number', async () => {
        const client = await makeLoggedInClient()
        const obj = await TestAutoIncrementNumber.create(client)
        expect(typeof obj.number).toBe('number')
        const obj2 = await TestAutoIncrementNumber.create(client)
        expect(obj2.number > obj.number).toBe(true)
    })

    test('set number by hands', async () => {
        const client = await makeLoggedInClient()
        const number = faker.random.number(1000, 10000000)
        const obj = await TestAutoIncrementNumber.create(client, { number })
        expect(obj.number).toBe(number)
    })

    test('set existing number', async () => {
        const client = await makeLoggedInClient()
        const obj = await TestAutoIncrementNumber.create(client)
        const { data, errors } = await TestAutoIncrementNumber.create(client, { number: obj.number }, { raw: true })
        expect(data).toStrictEqual({ 'obj': null })
        expect(errors[0]).toMatchObject({
            message: 'You attempted to perform an invalid mutation',
            name: 'ValidationFailureError',
            data: {
                messages: ['[unique:alreadyExists:number] Field number should be unique'],
            },
            path: ['obj'],
        })
    })
})
