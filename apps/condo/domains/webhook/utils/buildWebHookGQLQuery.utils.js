const { gql } = require('graphql-tag')
const pluralize = require('pluralize')
const dayjs = require('dayjs')
const { isString, isObject, isEmpty, keys, toPairs, fromPairs } = require('lodash')

/**
 * Prepare count of updated objects and query updated objects list.
 *
 * @param model String - model name
 * @param fields String - model fields in GQL format
 * @returns {Promise<{query: (*|DocumentNode), count: (*|DocumentNode)}>}
 */
async function buildWebHookGQLQuery (model, fields) {
    if (!isString(model)) throw new Error('model name is not a String')
    if (!isString(fields) && !isObject(fields)) throw new Error('fields argument is not a String or Object')
    if (isObject(fields)) {
        // convert to string! { id: 1, user: { id: 1, updatedAt: {} } } => { id user { id updatedAt } }
        fields = convertGQLFieldsObjectToGQLFieldsString(fields)
    }

    const MODEL = pluralize.singular(model)
    const MODELS = pluralize.plural(model)

    // NOTE(pahaz): some real world examples
    //
    // {
    //   allTickets (first: 3, skip: 1, sortBy: [updatedAt_ASC, id_ASC], where: { updatedAt_gt: "2021-05-12T20:10:48Z" }) {
    //     id updatedAt
    //   }
    //
    //   _allTicketsMeta (sortBy: [updatedAt_ASC, id_ASC], where: { updatedAt_gt: "2021-05-12T20:10:48Z" }) {
    //   	count
    //   }
    // }

    // NOTE(pahaz): wee need to sort by updatedAt + any field to prevent reordering in case of the same updatedAt date
    const query = gql`
        query ${MODEL}WebHookQuery ($first: Int, $skip: Int, $where: ${MODEL}WhereInput) {
            objs: all${MODELS} (first: $first, skip: $skip, sortBy: [updatedAt_ASC, id_ASC], where: $where) ${fields}
        }
    `

    const count = gql`
        query ${MODEL}WebHookQueryCount ($where: ${MODEL}WhereInput) {
            meta: _all${MODELS}Meta (where: $where) { count }
        }
    `

    return { query, count }
}

function getMaxUpdatedAtAndOffset (list) {
    if (!list || list.length <= 0) throw new Error('getMaxUpdatedAtAndOffset(): wrong list argument')
    let updatedAt = dayjs(list[0].updatedAt)
    let offset = 0
    for (const obj of list) {
        const objUpdatedAt = dayjs(obj.updatedAt)
        if (objUpdatedAt.isSame(updatedAt)) {
            offset += 1
        } else if (objUpdatedAt.isAfter(updatedAt)) {
            updatedAt = objUpdatedAt
            offset = 1
        } else {
            throw new Error('getMaxUpdatedAtAndOffset(): wrong list item updatedAt value')
        }
    }

    return [updatedAt.toISOString(), offset]
}

function convertGQLFieldsObjectToGQLFieldsString (obj) {
    return '{ ' + (toPairs(obj).map(([key, val]) => (isEmpty(val) ? key : key + ' ' + convertGQLFieldsObjectToGQLFieldsString(val))).join(' ')) + ' }'
}

function normalizeModelFieldsObject (json) {
    if (isEmpty(json)) return true
    return fromPairs(toPairs(json).map(([key, val]) => [key, normalizeModelFieldsObject(val)]))
}

module.exports = {
    buildWebHookGQLQuery,
    getMaxUpdatedAtAndOffset,
    convertGQLFieldsObjectToGQLFieldsString,
    normalizeModelFieldsObject,
}
