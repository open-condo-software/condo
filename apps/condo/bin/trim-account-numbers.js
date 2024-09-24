/**
 * Trim account number occurrences like 'л/с №' (л/с №1307 -> 1307)
 *
 * Usage:
 *      yarn workspace @app/condo node bin/trim-account-numbers
 */

const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const { BillingAccount } = require('@condo/domains/billing/utils/serverSchema')


const PROCESS_CHUNK_SIZE = 20
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'fill-address-key-field-processing-v2' } }

function log (msg, params = '') {
    console.log(msg, params)
}

function logCatch (error, params = '') {
    console.error(error)
    console.error(error.message, params)
}

function getEntityQuery (context, entity) {
    return context.adapter.knex(entity.gql.SINGULAR_FORM)
        .whereRaw('"deletedAt" is null and "number" similar to \'л/с\\s+№\\s+\\d+\'')
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
        .select('id', 'number')
}

async function proceedEntityItem (context, entity, item) {
    const accountNumber = item.number
        .replace(/л\/с\s+№\s+(\d+)/, '$1')
        .trim()

    await entity.update(context, item.id, {
        number: accountNumber,
        ...dvAndSender,
    })

    const toTrimEntititesCount = await entity.count(
        context, {
            id: item.id,
            deletedAt: null,
        }
    )

    return toTrimEntititesCount
}

async function proceedEntityPage (context, entity, items, state) {
    const toTrimEntitiesCount = await count(context, entity)

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

    log(`Page #${pageProcessed} for ${entity.gql.SINGULAR_FORM} processed. Proceeding percentage ${percentage} %. Remaining (waiting for processing): ${toTrimEntitiesCount}. TotalOffset: ${state[entity.gql.SINGULAR_FORM].offset}. Page processing stat: ${JSON.stringify({
        offsetCount,
        filledUpCount,
        errorToUpdateCount,
    })}`)

    state[entity.gql.SINGULAR_FORM].offset += offsetCount
}

async function proceedEntity (context, entity, state) {
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
    log('Start trimming account numbers for entities: BillingAccount')
    const chunkSize = 100
    const getEntityStartState = () => ({
        filledUpCount: 0,
        errorToUpdateCount: 0,
        pageProcessed: 0,
        offset: 0,
        total: 0,
    })
    const state = {
        BillingAccount: getEntityStartState(),
        chunkSize,
        filledUpCount: 0,
        errorToUpdateCount: 0,
        limits: {},
    }

    // proceeding entities one by one
    await proceedEntity(keystone, BillingAccount, state)

    log('Done', state)
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
