const path = require('path')

const chalk = require('chalk')
const { program } = require('commander')
const isNil = require('lodash/isNil')

const { getLogger } = require('@open-condo/keystone/logging')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { getAppName } = require('@open-condo/keystone/tracingUtils')

const logger = getLogger('re-encrypt-in-current-version')

const STATE = {
    errorCount: 0,
    processedCount: 0,
    successCount: 0,
    allCount: 0,
    errors: [],
}

function logState (state) {
    console.log(chalk.green('--------------------------'))
    console.log(chalk.green(`Items count: ${state.allCount}`))
    console.log(chalk.green(`Processed count: ${state.processedCount}`))
    console.log(chalk.green(`Success count: ${state.successCount}`))
    console.log(chalk.green(`Errors count: ${state.errorCount}`))
}

/**
 * @param {Keystone} keystone
 * @param {List} list
 * @param {SymmetricEncryptedTextImplementation[]} fields
 * */
async function processList (keystone, { list, fields }) {

    const ciphers = {}
    const oldVersionKeys = {}
    for (const field of fields) {
        ciphers[field.path] = field.cipherManager
        const oldVersionKeysForField = Object.keys(field.cipherManager._versions)
            .filter((versionKey) => versionKey !== field.cipherManager._currentVersionKey)
        if (oldVersionKeysForField.length) {
            oldVersionKeys[field.path] = oldVersionKeysForField.map(key => Buffer.from(key).toString('hex'))
        }
    }

    const where = { OR: [] }
    for (const field in oldVersionKeys) {
        for (const key of oldVersionKeys[field]) {
            where.OR.push({ [`${field}_starts_with`]: `${key}:` } )
        }
    }

    const adapter = list.adapter

    console.log(chalk.green('--------------------------'))
    console.log(chalk.green(`Processing list ${list.key}`))

    const { count: itemsToUpdateCount } = await adapter.itemsQuery({ where }, { meta: true }) // SELECT COUNT(*)...
    const listState = {
        allCount: itemsToUpdateCount,
        processedCount: 0,
        errorCount: 0,
        successCount: 0,
    }
    STATE.allCount += itemsToUpdateCount

    logState(listState)

    let first = 100
    let skip = 0
    let chunkLength
    do {
        const variables = { where, first, skip }
        const chunk = await adapter.itemsQuery(variables)

        const toUpdate = []

        for (const obj of chunk) {
            for (const key in ciphers) {
                if (isNil(obj[key])) continue
                try {
                    const { decrypted } = ciphers[key].decrypt(obj[key])
                    obj[key] = decrypted
                    toUpdate.push(obj)
                } catch (err) {
                    STATE.errorCount++
                    STATE.processedCount++
                    STATE.errors.push({ listKey: list.key, err, itemId: obj.id, itemField: key })
                    listState.errorCount++
                    listState.processedCount++
                    console.error(err)
                }
            }
        }

        const updatesPromises = toUpdate.map(async ({ id, ...updateInput }) => {
            try {
                await adapter.update(id, updateInput)
                STATE.successCount++
                listState.successCount++
            } catch (err) {
                console.error(err)
                STATE.errorCount++
                listState.errorCount++
            } finally {
                STATE.processedCount++
                listState.processedCount++
            }
        })

        await Promise.allSettled(updatesPromises)

        logState(listState)

        chunkLength = chunk.length
        skip = first
        first += 100
    } while (chunkLength)

    console.log(chalk.green('--------------------------'))
    console.log(chalk.green(`End process list ${list.key}`))
}

function getListsWithEncryptedFields (keystone) {
    return keystone.listsArray
        .map(list => ({ list, fields: list.fields.filter(field => field.constructor.name === 'SymmetricEncryptedTextImplementation') } ) )
        .filter(({ fields }) => fields.length)
}

function getOptions () {
    program.parse()
    let { all, include, exclude } = program.opts()

    if (all) {
        if (!isNil(include)) {
            console.log(chalk.red('You can not provide --include option with --all = true'))
            process.exit(1)
        }
    } else {
        if (!isNil(exclude)) {
            console.log(chalk.red('You can not provide --exclude option with --all = false'))
            process.exit(1)
        }
        if (isNil(include)) {
            console.log(chalk.red('Can not determine models to re encrypt. Got --all = false and zero items included'))
            process.exit(0)
        }
    }

    function transformToSchema (filters) {
        if (!filters) {
            return null
        }

        return filters.reduce((schema, filter) => {
            const [listKey, field] = filter.split('.')
            if (!schema[listKey]) schema[listKey] = []
            if (!isNil(field)) schema[listKey].push(field)
            return schema
        }, {})
    }

    return { all, include: transformToSchema(include), exclude: transformToSchema(exclude) }
}

function getDataToReEncrypt (keystone) {
    const { all, include, exclude } = getOptions()
    let filteredLists = getListsWithEncryptedFields(keystone)
    if (all) {
        if (exclude !== null) {
            filteredLists = filteredLists
                .filter(({ list }) => isNil(exclude[list.key]))
                .map((listWithFields) => {
                    let { list, fields } = listWithFields
                    const excludedFieldsOfList = exclude[list.key]
                    if (!excludedFieldsOfList.length) return listWithFields
                    fields = fields.filter((field) => !excludedFieldsOfList.includes(field.name))
                    if (!fields.length) {
                        return null
                    }
                    listWithFields.fields = fields
                    return listWithFields
                })
        }
    } else {
        filteredLists = filteredLists
            .filter(({ list }) => !isNil(include[list.key]))
            .map((listWithFields) => {
                let { list, fields } = listWithFields
                const includedFieldsOfList = include[list.key]
                if (!includedFieldsOfList.length) return listWithFields
                fields = fields.filter((field) => includedFieldsOfList.includes(field.path))
                if (!fields.length) {
                    return null
                }
                listWithFields.fields = fields
                return listWithFields
            })
    }
    return filteredLists.filter(Boolean)
}

program.option('-a --all', 're encrypt all fields of SymmetricEncryptedText type in all lists', false)
program.option('-i --include <listKey.field...>', `Collection of <listKey> or <listKey.field> divided by space.
    If passed, only these lists and fields will be user. Works only with --all = false`, null)
program.option('-e --exclude <listKey.field...>', 'Same as --include, but works only with --app = true and determines\n ' +
    'models and fields which should not be modified', null)
program.description(`Re encrypts fields of type SymmetricEncryptedText with old secrets to new secrets
NOTE: it only touches data, which was encrypted in existing versions. If old version was forgotten, this script won't tell, or might error
If there is data under field SymmetricEncryptedText, which was not encrypted by field methods, script will skip it or will error
`)


async function main () {
    program.parse()
    const index = path.resolve('./index.js')
    const { keystone } = await prepareKeystoneExpressApp(index)
    
    const listsWithEncryptedFieldsToReEncrypt = getDataToReEncrypt(keystone)
    logger.info({ msg: 're-encrypt-in-current-version', data: { app: getAppName() } })
    await keystone.connect()
    let i = 0
    for (const listFieldsPair of listsWithEncryptedFieldsToReEncrypt) {
        i++
        await processList(keystone, listFieldsPair)
        console.log(chalk.green('--------------------------'))
        console.log(chalk.greenBright(`Processed lists: ${i}/${listsWithEncryptedFieldsToReEncrypt.length}`))
        logState(STATE)
    }

    if (STATE.errors.length) {
        console.log(chalk.red('ERRORS:'))
    }
    for (const { listKey, itemId, itemField, err } of STATE.errors) {
        console.log(chalk.red(`- List: ${listKey} id: ${itemId} field: ${itemField}`))
        console.log(chalk.red(err))
        console.log(chalk.red(err.toString))
    }
}

main().then(() => process.exit(0)).catch((e) => {
    console.error(e)
    process.exit(1)
})
