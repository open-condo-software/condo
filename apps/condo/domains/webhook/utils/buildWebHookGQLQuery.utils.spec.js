/**
 * @jest-environment node
 */

const { buildWebHookGQLQuery, getMaxUpdatedAtAndOffset, convertGQLFieldsObjectToGQLFieldsString, normalizeModelFieldsObject } = require('../utils/buildWebHookGQLQuery.utils')
const { execGqlAsUser } = require('@condo/domains/common/utils/codegeneration/generate.server.utils')
const { getSchemaCtx, getFieldNames, getFilterNames } = require('@condo/keystone/schema')
const { makeLoggedInAdminClient, setFakeClientMode } = require('@condo/keystone/test.utils')

const index = require('@app/condo')

describe('buildWebHookGQLQuery', () => {
    setFakeClientMode(index)

    test('buildWebHookGQLQuery(WebHook)', async () => {
        const { query, count } = await buildWebHookGQLQuery('WebHook', '{ id createdAt }')

        const client = await makeLoggedInAdminClient()
        const { keystone } = await getSchemaCtx('User')

        const objs = await execGqlAsUser(keystone, client.user, {
            query,
            variables: {
                first: 10,
                skip: 0,
                where: { updatedAt_gt: '2022-03-03T10:50:50.777Z' },
            },
            dataPath: 'objs',
        })

        expect(objs.length >= 0).toBeTruthy()

        const countResult = await execGqlAsUser(keystone, client.user, {
            query: count,
            variables: {
                where: { updatedAt_gt: '2022-03-03T10:50:50.777Z' },
            },
            dataPath: 'meta.count',
        })

        expect(countResult >= 0).toBeTruthy()
    })
    test('buildWebHookGQLQuery(WebHook) with Json object value', async () => {
        const { query, count } = await buildWebHookGQLQuery('WebHook', { 'id': {}, createdAt: true })

        const client = await makeLoggedInAdminClient()
        const { keystone } = await getSchemaCtx('User')

        const objs = await execGqlAsUser(keystone, client.user, {
            query,
            variables: {
                first: 10,
                skip: 0,
                where: { updatedAt_gt: '2022-03-03T10:50:50.777Z' },
            },
            dataPath: 'objs',
        })

        expect(objs.length >= 0).toBeTruthy()

        const countResult = await execGqlAsUser(keystone, client.user, {
            query: count,
            variables: {
                where: { updatedAt_gt: '2022-03-03T10:50:50.777Z' },
            },
            dataPath: 'meta.count',
        })

        expect(countResult >= 0).toBeTruthy()
    })
    test('getMaxUpdatedAtAndOffset simple cases', () => {
        expect(getMaxUpdatedAtAndOffset([
            {
                'id': '7067fb79-c1ee-4a9f-ac36-2f2fd0d9fcd0',
                'updatedAt': '2021-06-09T17:21:43.593Z',
            },
            {
                'id': '72aa31e0-bd37-42fc-9e8c-1674a9afe4b4',
                'updatedAt': '2021-06-10T15:26:56.494Z',
            },
            {
                'id': 'aab87c31-ea9b-4508-a6ae-38fb8179fa3b',
                'updatedAt': '2021-06-10T15:41:46.393Z',
            },
        ]))
            .toEqual(['2021-06-10T15:41:46.393Z', 1])
        expect(getMaxUpdatedAtAndOffset([
            {
                'id': '7067fb79-c1ee-4a9f-ac36-2f2fd0d9fcd0',
                'updatedAt': '2021-06-09T17:21:43.593Z',
            },
            {
                'id': '72aa31e0-bd37-42fc-9e8c-1674a9afe4b4',
                'updatedAt': '2021-06-10T15:41:46.393Z',
            },
            {
                'id': 'aab87c31-ea9b-4508-a6ae-38fb8179fa3b',
                'updatedAt': '2021-06-10T15:41:46.393Z',
            },
        ]))
            .toEqual(['2021-06-10T15:41:46.393Z', 2])
        expect(getMaxUpdatedAtAndOffset([
            {
                'id': '7067fb79-c1ee-4a9f-ac36-2f2fd0d9fcd0',
                'updatedAt': '2021-06-10T15:41:46.393Z',
            },
            {
                'id': '72aa31e0-bd37-42fc-9e8c-1674a9afe4b4',
                'updatedAt': '2021-06-10T15:41:46.393Z',
            },
            {
                'id': 'aab87c31-ea9b-4508-a6ae-38fb8179fa3b',
                'updatedAt': '2021-06-10T15:41:46.393Z',
            },
        ]))
            .toEqual(['2021-06-10T15:41:46.393Z', 3])
    })
    test('getMaxUpdatedAtAndOffset one item case', () => {
        expect(getMaxUpdatedAtAndOffset([
            {
                'id': '7067fb79-c1ee-4a9f-ac36-2f2fd0d9fcd0',
                'updatedAt': '2021-06-09T17:21:43.593Z',
            },
        ]))
            .toEqual(['2021-06-09T17:21:43.593Z', 1])
    })
    test('convertGQLFieldsObjectToGQLFieldsString simple cases', () => {
        expect(convertGQLFieldsObjectToGQLFieldsString({ id: 1, name: {} })).toEqual('{ id name }')
        expect(convertGQLFieldsObjectToGQLFieldsString({ id: 1, obj: { id: 1, name: false } })).toEqual('{ id obj { id name } }')
        expect(convertGQLFieldsObjectToGQLFieldsString({})).toEqual('{  }')
    })
    test('normalizeModelFieldsObject simple cases', () => {
        expect(normalizeModelFieldsObject({ id: 1, name: 2 })).toEqual({ id: true, name: true })
        expect(normalizeModelFieldsObject({})).toEqual(true)
    })

    describe('getFieldNames()', () => {
        test('getFieldNames(WebHook)', () => {
            const fields = getFieldNames('WebHook')
            expect(fields).toEqual([
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'name',
                    'type': 'Text',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'url',
                    'type': 'Text',
                },
                {
                    'hasGQLSubFields': true,
                    'isRelation': true,
                    'name': 'user',
                    'type': 'Relationship',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'description',
                    'type': 'Text',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'id',
                    'type': 'Uuid',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'v',
                    'type': 'Integer',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'createdAt',
                    'type': 'DateTimeUtc',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'updatedAt',
                    'type': 'DateTimeUtc',
                },
                {
                    'hasGQLSubFields': true,
                    'isRelation': true,
                    'name': 'createdBy',
                    'type': 'AuthedRelationship',
                },
                {
                    'hasGQLSubFields': true,
                    'isRelation': true,
                    'name': 'updatedBy',
                    'type': 'AuthedRelationship',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'deletedAt',
                    'type': 'DateTimeUtc',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'newId',
                    'type': 'HiddenRelationship',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'dv',
                    'type': 'Integer',
                },
                {
                    'hasGQLSubFields': true,
                    'isRelation': false,
                    'name': 'sender',
                    'type': 'Json',
                },
            ])
        })
        test('getFieldNames(WebHookSubscription)', () => {
            const fields = getFieldNames('WebHookSubscription')
            expect(fields).toEqual([
                {
                    'hasGQLSubFields': true,
                    'isRelation': true,
                    'name': 'webhook',
                    'type': 'Relationship',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'lastUpdatedAt',
                    'type': 'DateTimeUtc',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'lastUpdatedAtOffset',
                    'type': 'Integer',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'model',
                    'type': 'Select',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'fields',
                    'type': 'Json',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'filters',
                    'type': 'Json',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'id',
                    'type': 'Uuid',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'v',
                    'type': 'Integer',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'createdAt',
                    'type': 'DateTimeUtc',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'updatedAt',
                    'type': 'DateTimeUtc',
                },
                {
                    'hasGQLSubFields': true,
                    'isRelation': true,
                    'name': 'createdBy',
                    'type': 'AuthedRelationship',
                },
                {
                    'hasGQLSubFields': true,
                    'isRelation': true,
                    'name': 'updatedBy',
                    'type': 'AuthedRelationship',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'deletedAt',
                    'type': 'DateTimeUtc',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'newId',
                    'type': 'HiddenRelationship',
                },
                {
                    'hasGQLSubFields': false,
                    'isRelation': false,
                    'name': 'dv',
                    'type': 'Integer',
                },
                {
                    'hasGQLSubFields': true,
                    'isRelation': false,
                    'name': 'sender',
                    'type': 'Json',
                },
            ])
        })
    })

    describe('getFilterNames()', () => {
        test('getFilterNames(WebHook)', () => {
            const fields = getFilterNames('WebHook')
            expect(fields).toEqual([
                'name',
                'name_not',
                'name_contains',
                'name_not_contains',
                'name_starts_with',
                'name_not_starts_with',
                'name_ends_with',
                'name_not_ends_with',
                'name_i',
                'name_not_i',
                'name_contains_i',
                'name_not_contains_i',
                'name_starts_with_i',
                'name_not_starts_with_i',
                'name_ends_with_i',
                'name_not_ends_with_i',
                'name_in',
                'name_not_in',
                'url',
                'url_not',
                'url_contains',
                'url_not_contains',
                'url_starts_with',
                'url_not_starts_with',
                'url_ends_with',
                'url_not_ends_with',
                'url_i',
                'url_not_i',
                'url_contains_i',
                'url_not_contains_i',
                'url_starts_with_i',
                'url_not_starts_with_i',
                'url_ends_with_i',
                'url_not_ends_with_i',
                'url_in',
                'url_not_in',
                'user_is_null',
                'description',
                'description_not',
                'description_contains',
                'description_not_contains',
                'description_starts_with',
                'description_not_starts_with',
                'description_ends_with',
                'description_not_ends_with',
                'description_i',
                'description_not_i',
                'description_contains_i',
                'description_not_contains_i',
                'description_starts_with_i',
                'description_not_starts_with_i',
                'description_ends_with_i',
                'description_not_ends_with_i',
                'description_in',
                'description_not_in',
                'id',
                'id_not',
                'id_in',
                'id_not_in',
                'v',
                'v_not',
                'v_lt',
                'v_lte',
                'v_gt',
                'v_gte',
                'v_in',
                'v_not_in',
                'createdAt',
                'createdAt_not',
                'createdAt_lt',
                'createdAt_lte',
                'createdAt_gt',
                'createdAt_gte',
                'createdAt_in',
                'createdAt_not_in',
                'updatedAt',
                'updatedAt_not',
                'updatedAt_lt',
                'updatedAt_lte',
                'updatedAt_gt',
                'updatedAt_gte',
                'updatedAt_in',
                'updatedAt_not_in',
                'createdBy_is_null',
                'updatedBy_is_null',
                'deletedAt',
                'deletedAt_not',
                'deletedAt_lt',
                'deletedAt_lte',
                'deletedAt_gt',
                'deletedAt_gte',
                'deletedAt_in',
                'deletedAt_not_in',
                'newId',
                'newId_not',
                'newId_contains',
                'newId_not_contains',
                'newId_starts_with',
                'newId_not_starts_with',
                'newId_ends_with',
                'newId_not_ends_with',
                'newId_i',
                'newId_not_i',
                'newId_contains_i',
                'newId_not_contains_i',
                'newId_starts_with_i',
                'newId_not_starts_with_i',
                'newId_ends_with_i',
                'newId_not_ends_with_i',
                'newId_in',
                'newId_not_in',
                'dv',
                'dv_not',
                'dv_lt',
                'dv_lte',
                'dv_gt',
                'dv_gte',
                'dv_in',
                'dv_not_in',
                'sender',
                'sender_not',
                'sender_in',
                'sender_not_in',
            ])
        })
    })
})
