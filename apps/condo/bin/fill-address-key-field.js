/**
 * Fill up address key for property entities with address search limit
 *
 * Usage:
 *      yarn workspace @app/condo node bin/fill-address-key-field
 */

const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const { get, isNil } = require('lodash')

const { fetch } = require('@open-condo/keystone/fetch')

const { BillingProperty } = require('@condo/domains/billing/utils/serverSchema')
const { B2CAppProperty } = require('@condo/domains/miniapp/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')


const DADATA_CONFIG = process.env.ADDRESS_SUGGESTIONS_CONFIG ? JSON.parse(process.env.ADDRESS_SUGGESTIONS_CONFIG) : {}
const PROCESS_CHUNK_SIZE = 20
const DADATA_REQ_BOTTOM_LIMIT = 10000 + PROCESS_CHUNK_SIZE
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'fill-address-key-field-processing-v2' } }

function log (msg, params = '') {
    console.log(msg, params)
}

function logError (msg, params = '') {
    console.error(msg, params)
}

function logCatch (error, params = '') {
    console.error(error)
    console.error(error.message, params)
}

async function getLimits () {
    try {
        const params = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${DADATA_CONFIG.apiToken}`,
                'X-Secret': DADATA_CONFIG.apiSecret,
            },
        }

        const result = await fetch('https://dadata.ru/api/v2/stat/daily', params)
        const status = result.status
        if (status === 200) {
            return await result.json()
        }
    } catch (e) {
        logCatch(e)
    }
}

async function checkLimits (state) {
    const limits = await getLimits()
    state.limits = limits
    const remainingSuggestions = get(limits, ['remaining', 'suggestions'])

    if (!isNil(remainingSuggestions)) {
        if (remainingSuggestions <= DADATA_REQ_BOTTOM_LIMIT) {
            logError('Can not continue to filling up addressKey since we are hitting the limit', state)
            process.exit(1)
        }
    } else {
        logError('Can not continue to filling up addressKey since can not retrieve remaining suggestion limits', state)
        process.exit(1)
    }
}

function getEntityQuery (context, entity) {
    return context.adapter.knex(entity.gql.SINGULAR_FORM)
        .whereRaw(`"deletedAt" is null and "addressKey" is null and "sender" ->> 'fingerprint' != '${dvAndSender.sender.fingerprint}'`)
}

async function count (context, entity) {
    const result = await getEntityQuery(context, entity).count('id')
    return parseInt(result[0].count)
}

async function readPage (context, entity, state) {
    return await getEntityQuery(context, entity)
        .orderBy('id', 'desc')
        .limit(PROCESS_CHUNK_SIZE)
        .offset(state[entity.gql.SINGULAR_FORM].offset)
        .select('id')
}

async function proceedEntityItem (context, entity, item) {
    // in order to update addressKey we will use exists trigger that starts at any update action
    await entity.update(context, item.id, dvAndSender)

    // let's check if addressKey update occurred
    const missingAddressKeyCount = await entity.count(
        context, {
            id: item.id,
            deletedAt: null,
            addressKey: null,
        }
    )

    return missingAddressKeyCount
}

async function proceedEntityPage (context, entity, items, state) {
    await checkLimits(state)
    const emptyEntityCount = await count(context, entity)

    // proceed item one by one
    let offsetCount = 0
    let filledUpCount = 0
    let errorToUpdateCount = 0

    await Promise.all(items.map(async (item) => {
        try {
            offsetCount += await proceedEntityItem(context, entity, item)
            filledUpCount += 1
        } catch (e) {
            logCatch(e, { entityName: entity.gql.SINGULAR_FORM, entityId: item.id })
            errorToUpdateCount += 1
        }
    }))

    // update state
    state[entity.gql.SINGULAR_FORM].pageProcessed += 1
    state[entity.gql.SINGULAR_FORM].filledUpCount += filledUpCount
    state[entity.gql.SINGULAR_FORM].errorToUpdateCount += errorToUpdateCount
    state.filledUpCount += filledUpCount
    state.errorToUpdateCount += errorToUpdateCount

    // print some stat
    const pageProcessed = state[entity.gql.SINGULAR_FORM].pageProcessed
    const totalProceededCount = state[entity.gql.SINGULAR_FORM].filledUpCount + state[entity.gql.SINGULAR_FORM].errorToUpdateCount
    const totalCount = state[entity.gql.SINGULAR_FORM].total
    const percentage = totalCount > 0 ? parseFloat(totalProceededCount / totalCount * 100).toFixed(5) : 100

    log(`Page #${pageProcessed} for ${entity.gql.SINGULAR_FORM} processed. Proceeding percentage ${percentage} %. Remaining (waiting for processing): ${emptyEntityCount}. TotalOffset (not recognized addresses): ${state[entity.gql.SINGULAR_FORM].offset}. Page processing stat: ${JSON.stringify({
        offsetCount,
        filledUpCount,
        errorToUpdateCount,
    })}`)

    // since some addresses can be not recognized, we have to determinate
    // how many entities we need to skip in the next page load
    state[entity.gql.SINGULAR_FORM].offset += offsetCount
}

async function proceedEntity (context, entity, state) {
    // get limits for log purposes
    await checkLimits(state)

    // let's count how much to proceed
    log(`Requesting count of ${entity.gql.SINGULAR_FORM} entity`)
    state[entity.gql.SINGULAR_FORM].total = await count(context, entity)

    // log proceeding state
    log(`Start proceeding ${entity.gql.SINGULAR_FORM} entity`, {
        limits: state.limits,
        [entity.gql.SINGULAR_FORM]: state[entity.gql.SINGULAR_FORM],
    })

    // do page by page proceeding
    let items = []
    const checkAlreadyProceededCount = () => state[entity.gql.SINGULAR_FORM].total > state[entity.gql.SINGULAR_FORM].filledUpCount + state[entity.gql.SINGULAR_FORM].errorToUpdateCount
    do {
        items = await readPage(context, entity, state)
        await proceedEntityPage(context, entity, items, state)
    } while (items.length > 0 && checkAlreadyProceededCount())
}

async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    // prepare initial vars
    log('Start filling up addressKey data for entities: Resident, Property, BillingProperty, B2CAppProperty')
    const chunkSize = 100
    const getEntityStartState = () => ({
        filledUpCount: 0,
        errorToUpdateCount: 0,
        pageProcessed: 0,
        offset: 0,
        total: 0,
    })
    const state = {
        Resident: getEntityStartState(),
        Property: getEntityStartState(),
        BillingProperty: getEntityStartState(),
        B2CAppProperty: getEntityStartState(),
        chunkSize,
        filledUpCount: 0,
        errorToUpdateCount: 0,
        limits: {},
    }

    // proceeding entities one by one
    await proceedEntity(keystone, Resident, state)
    await proceedEntity(keystone, Property, state)
    await proceedEntity(keystone, BillingProperty, state)
    await proceedEntity(keystone, B2CAppProperty, state)

    log('Done', state)
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
