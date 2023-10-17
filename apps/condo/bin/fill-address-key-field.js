/**
 * Fill up address key for property entities with address search limit
 *
 * Usage:
 *      yarn workspace @app/condo node bin/fill-address-key-field
 */

const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const { get, isNil } = require('lodash')
const fetch = require('node-fetch')

const { getLogger } = require('@open-condo/keystone/logging')

const { BillingProperty } = require('@condo/domains/billing/utils/serverSchema')
const { B2CAppProperty } = require('@condo/domains/miniapp/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')


const DADATA_CONFIG = process.env.ADDRESS_SUGGESTIONS_CONFIG ? JSON.parse(process.env.ADDRESS_SUGGESTIONS_CONFIG) : {}
const PROCESS_CHUNK_SIZE = 10
const DADATA_REQ_BOTTOM_LIMIT = 10000 + PROCESS_CHUNK_SIZE
const logger = getLogger('fill-address-key-field')
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'fill-address-key-field-processing' } }

function log (msg, params = '') {
    console.log(msg, params)
}

function logError (msg, params = '') {
    console.error(msg, params)
}

function logCatch (error, params = '') {
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

    state.limits = limits
}

async function count (context, entity) {
    return await entity.count(
        context, {
            deletedAt: null,
            addressKey: null,
        }
    )
}

async function readPage (context, entity) {
    return await entity.getAll(
        context, {
            deletedAt: null,
            addressKey: null,
        }, {
            sortBy: 'id_DESC',
            first: PROCESS_CHUNK_SIZE,
        }
    )
}

async function proceedEntityItem (context, entity, item) {
    // in order to update addressKey we will use exists trigger that starts at any update action
    // we have to avoid the update it twice - let's check item sender to control that last update wasn't our update
    if (item.sender.fingerprint !== dvAndSender.sender.fingerprint) {
        await entity.update(context, item.id, dvAndSender)
    }
}

async function proceedEntityPage (context, entity, items, state) {
    await checkLimits(state)
    const emptyEntityCount = await count(context, entity)

    // proceed item one by one
    let filledUpCount = 0
    let errorToUpdateCount = 0
    for (let i = 0 ; i < items.length; i++) {
        try {
            await proceedEntityItem(context, entity, items[i])
            filledUpCount += 1
        } catch (e) {
            logCatch(e, { entityName: entity.gql.SINGULAR_FORM, entityId: items[i].id })
            errorToUpdateCount += 1
        }
    }

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

    log(`Page #${pageProcessed} for ${entity.gql.SINGULAR_FORM} processed. Proceeding percentage ${percentage} %. Remaining: ${emptyEntityCount}`)
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
        items = await readPage(context, entity)
        await proceedEntityPage(context, entity, items, state)
    } while (items.length > 0 && checkAlreadyProceededCount() )
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
    const getEntityStartState = () => ({ filledUpCount: 0, errorToUpdateCount: 0, pageProcessed: 0, total: 0 })
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
