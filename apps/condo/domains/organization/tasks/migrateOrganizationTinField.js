const { getSchemaCtx } = require('@core/keystone/schema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { isValidTin } = require('@condo/domains/organization/utils/tin.utils')

const log = (message, intentChar = null, intentRepeatTimes = 10) => {
    if (intentChar != null) {
        console.log(`${ intentChar.repeat(intentRepeatTimes) } ${ message } ${ intentChar.repeat(intentRepeatTimes) }`)
    } else {
        console.log(message)
    }
}

const migrateOrganizationTinField = async () => {
    // initialize context stuff
    log('Start migration', '=')
    const { keystone: context } = await getSchemaCtx('Organization')
    const { knex } = context.adapter

    // let's proceed organizations page by page
    log('Start proceeding organizations page by page', '-')
    const state = {
        pageSize: 100,
        offset: 0,
        hasMore: true,
        processedOrganizations: 0,
        processedPages: 0,
        emptyMetaFieldCount: 0,
        emptyInnFieldCount: 0,
        invalidInnFieldCount: 0,
        validInnFieldCount: 0,
    }

    do {
        // let's get organizations ordered by creation date
        log(`Processing page ${ state.processedPages + 1 }`)
        const organizationsChunk = await Organization.getAll(context, {}, {
            sortBy: 'createdAt_ASC',
            first: state.pageSize,
            skip: state.offset,
        })

        // go through chunk and do validations && set values
        organizationsChunk
            // don't touch empty meta organizations
            .filter(organization => organization.meta != null)
            // don't touch empty inn organizations
            .filter(organization => organization.meta.inn != null)
            .forEach(organization => {
                // let's assume all organizations at this point has meta.inn values
                // now we will validate inn and set it to the organization.tin in case if inn are valid
                const innValue = organization.meta.inn.toString().trim()
                const isValid = isValidTin(innValue, organization.country)

                // set valid value
                if (isValid) {
                    organization.tin = innValue
                    state.validInnFieldCount++
                } else {
                    state.invalidInnFieldCount++
                }
            })

        // the last step - produce all changes to the DB
        //  await Promise.all will do that in parallel way
        const updatedItems = await Promise.all(
            organizationsChunk
                // don't touch empty meta organizations, since we don't proceed them at all
                .filter(organization => organization.meta != null)
                .map(async (organization) => {
                    const { id, tin } = organization

                    if (tin == null) {
                        state.emptyInnFieldCount++
                    }

                    return await knex('Organization')
                        .update({ tin })
                        .where({ id })
                })
        )

        // check if we have more pages
        state.hasMore = organizationsChunk.length > 0
        state.offset += state.pageSize
        state.processedOrganizations += organizationsChunk.length
        state.processedPages++
        state.emptyMetaFieldCount += organizationsChunk.length - updatedItems.length
    } while (state.hasMore)

    // some stat
    log('End proceeding organizations', '-')
    log('Migration stats', '-')
    log(`Processed pages = ${ state.processedPages }`)
    log(`Organizations per page = ${ state.pageSize }`)
    log(`Organizations with empty 'meta' field = ${ state.emptyMetaFieldCount }`)
    log(`Organizations with empty & invalid 'meta.inn' field = ${ state.emptyInnFieldCount }`)
    log(`Organizations with invalid 'meta.inn' field = ${ state.invalidInnFieldCount }`)
    log(`Organizations with valid 'meta.inn' field = ${ state.validInnFieldCount }`)
    log(`Organizations total = ${ state.processedOrganizations }`)
    log('Migration completed!', '=')
    process.exit(0)
}

module.exports = {
    migrateOrganizationTinField,
}
