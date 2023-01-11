/**
 * Migrate User.importId/User.importRemoteSystem fields data to separate entity: UserExternalIdentity
 *
 * Usage:
 *      yarn workspace @app/condo node bin/migrate-user-import-id-data-to-user-external-identity
 */

const path = require('path')
const dayjs = require('dayjs')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { User, UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')
const { IDP_TYPES } = require('@condo/domains/user/constants/common')


// init utils & common vars
const dv = 1
const sender = { dv, fingerprint: 'migrate-user-importId-to-externalIdentity' }

const log = (args) => {
    console.log(`${new Date().toISOString()}: ${JSON.stringify(args)}`)
}

const readImportedUsersPage = async ({ context, offset, pageSize }) => {
    const { knex } = context.adapter
    // retrieve users page where user.importId is filled up
    return await knex('User')
        .whereNotNull('importId')
        .whereNotNull('importRemoteSystem')
        .offset(offset)
        .limit(pageSize)
        .orderBy('id', 'asc')
}

const migrateUserImportIdDataToUserExternalIdentity = async (batchSize = 100) => {
    // initialize context
    const { keystone: context } = await getSchemaCtx('User')

    // let's save process state to provide more readable logs
    let usersBatch = []
    const state = {
        pageSize: batchSize,
        offset: 0,
        hasMore: true,
        processedPages: 0,
        migratedUsers: 0,
        alreadyMigratedUsers: 0,
        usersWithNotExpectedRemoteSystemCode: 0,
        notExpectedRemoteSystemCodes: [],
        startTime: dayjs(),
    }

    log({ msg: 'Start migration', state })
    do {
        // load imported users
        usersBatch = await readImportedUsersPage({
            context,
            offset: state.offset,
            pageSize: state.pageSize,
        })

        // let's proceed imported users
        await Promise.all(usersBatch.map(async ({ id, importRemoteSystem, importId }) => {
            // firstly let's validate that importRemoteSystem is one of expected external system code
            // if not exist - save state for that
            if (!IDP_TYPES.includes(importRemoteSystem)) {
                state.usersWithNotExpectedRemoteSystemCode++

                if (!state.notExpectedRemoteSystemCodes.includes(importRemoteSystem)) {
                    state.notExpectedRemoteSystemCodes.push(importRemoteSystem)
                }
                return
            }

            // second step - try to retrieve UserExternalIdentity corresponding for this user
            // make sure that user can have only one identity in external system
            // and user possibly was changed identityId after data was migrated (User.importId != UserExternalIdentity.identityId)
            const externalIdentities = await UserExternalIdentity.getAll(context, {
                user: { id },
                identityType: importRemoteSystem,
            })

            // if external entity exists - nothing to do, data already migrated
            if (externalIdentities.length > 0) {
                state.alreadyMigratedUsers++
                return
            }

            // if external entity not exists - create it
            await UserExternalIdentity.create(context, {
                dv,
                sender,
                user: { connect: { id } },
                identityId: importId,
                identityType: importRemoteSystem,
                meta: {},
            })
            state.migratedUsers ++
        }))

        // update state
        state.hasMore = usersBatch.length > 0
        state.offset += state.pageSize
        state.processedPages++

        // log state
        log({ msg: 'Processing', state })
    } while (state.hasMore)

    // log some stat
    const endTime = dayjs()
    log({
        msg: 'End migration',
        endTime,
        processingTime: `${endTime.unix() - state.startTime.unix()} sec`,
        state,
    })
}

async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    // start migration
    await migrateUserImportIdDataToUserExternalIdentity()

    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})