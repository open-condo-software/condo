const path = require('path')

const chalk = require('chalk')
const { program } = require('commander')
const get = require('lodash/get')
const isNil = require('lodash/isNil')
const set = require('lodash/set')

const { ENCRYPTION_PREFIX } = require('@open-condo/keystone/crypto/EncryptionManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { getAppName } = require('@open-condo/keystone/tracingUtils')

const logger = getLogger()

const STATE = {
    errorCount: 0,
    processedCount: 0,
    successCount: 0,
    allCount: 0,
    errors: undefined,
}

const CHUNK_SIZE = 100

function logState (state, indent = '') {
    console.log(chalk.green('--------------------------'))
    console.log(chalk.green(`${indent}Items count: ${state.allCount}`))
    console.log(chalk.green(`${indent}Processed count: ${state.processedCount}`))
    console.log(chalk.green(`${indent}Success count: ${state.successCount}`))
    console.log(chalk.green(`${indent}Errors count: ${state.errorCount}`))
}

function getWhereCondition (encryptionManagers, currentVersionIdsByField) {
    const where = { AND: [], OR: [] }
    for (const field in currentVersionIdsByField) {
        if (OPTIONS.fromVersions) {
            for (const versionId of OPTIONS.fromVersions) {
                if (encryptionManagers[field]._config[versionId]) {
                    where.OR.push({ [`${field}_starts_with`]: `${ENCRYPTION_PREFIX}:${Buffer.from(versionId).toString('hex')}:` })
                }
            }
        } else {
            where.AND.push({ [`${field}_not_starts_with`]: `${ENCRYPTION_PREFIX}:${currentVersionIdsByField[field]}:` } )
        }
    }
    return where
}

/**
 * @param {Keystone} keystone
 * @param {List} list
 * @param {EncryptedTextImplementation[]} fields
 * */
async function processList (keystone, { list, fields }) {

    const encryptionManagers = {}
    const currentVersionIdsByField = {}
    for (const field of fields) {
        encryptionManagers[field.path] = field.encryptionManager
        currentVersionIdsByField[field.path] = Buffer.from(field.encryptionManager._encryptionVersionId).toString('hex')
    }

    const where = getWhereCondition(encryptionManagers, currentVersionIdsByField)

    const adapter = list.adapter

    console.log(chalk.green('--------------------------'))
    console.log(chalk.green(`Processing list ${list.key}`))

    let { count: itemsToUpdateCount } = await adapter.itemsQuery({ where }, { meta: true }) // SELECT COUNT(*)...
    const listState = {
        allCount: itemsToUpdateCount,
        processedCount: 0,
        errorCount: 0,
        successCount: 0,
        decryptErrors: undefined,
        updateErrors: undefined,
    }

    const logIndent = '    '
    logState(listState, logIndent)

    let first = CHUNK_SIZE
    let skip = 0
    do {
        const variables = { where, first, skip }
        const chunk = await adapter.itemsQuery(variables)

        const toUpdate = []

        for (const obj of chunk) {
            let didDecryptAnyFields = false
            const nextErrorsCount = listState.errorCount + 1
            for (const key in encryptionManagers) {
                if (isNil(obj[key])) continue
                try {
                    const decrypted = encryptionManagers[key].decrypt(obj[key])
                    if (isNil(decrypted)) {
                        throw new Error('Can not decrypt field')
                    }
                    obj[key] = decrypted
                    didDecryptAnyFields = true
                } catch (err) {
                    set(listState, `decryptErrors.${key}.${obj.id}`, err)
                    listState.errorCount = nextErrorsCount
                }
            }
            if (didDecryptAnyFields) {
                toUpdate.push(obj)
            } else {
                listState.processedCount++
            }
        }

        const updatesPromises = toUpdate.map(async ({ id, ...updateInput }) => {
            try {
                await adapter.update(id, updateInput)
                listState.successCount++
            } catch (err) {
                listState.errorCount++
                listState.updateErrors[id] = err
            } finally {
                listState.processedCount++
            }
        })

        await Promise.allSettled(updatesPromises)

        logState(listState, logIndent)

        itemsToUpdateCount -= chunk.length
        skip = first
        first += CHUNK_SIZE
    } while (itemsToUpdateCount > 0)

    console.log(chalk.green('--------------------------'))
    console.log(chalk.green(`End process list ${list.key}`))
    return listState
}

function getListsWithEncryptedFields (keystone) {
    return keystone.listsArray
        .map(list => ({ list, fields: list.fields.filter(field => field.constructor.name === 'EncryptedTextImplementation') } ) )
        .filter(({ fields }) => fields.length)
}

function parseOptions () {
    program.parse()
    let { all, include, exclude, fromVersions } = program.opts()

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

    OPTIONS.all = all
    OPTIONS.include = transformToSchema(include)
    OPTIONS.exclude = transformToSchema(exclude)
    OPTIONS.fromVersions = isNil(fromVersions) ? fromVersions : Array.isArray(fromVersions) ? fromVersions : [fromVersions]
}

const OPTIONS = {
    all: undefined,
    include: undefined,
    exclude: undefined,
    fromVersions: undefined,
}

function getDataToReEncrypt (keystone) {
    const { all, include, exclude } = OPTIONS
    let filteredLists = getListsWithEncryptedFields(keystone)
    if (all) {
        if (exclude !== null) {
            filteredLists = filteredLists
                .filter(({ list }) => isNil(exclude[list.key]))
        }
    } else {
        filteredLists = filteredLists
            .filter(({ list }) => !isNil(include[list.key]))
    }
    return filteredLists.filter(Boolean)
}

function logErrors () {
    if (STATE.errors) {
        console.log(chalk.redBright('ERRORS:'))
    }
    for (const listKey in STATE.errors) {
        console.log(chalk.redBright(` - ${listKey}:`))
        const updateErrors = get(STATE.errors[listKey], 'update')
        if (updateErrors) {
            console.log(chalk.redBright('   Update errors:'))
        }
        for (const itemId in updateErrors) {
            console.log(chalk.redBright(`    - id: ${itemId} | ${updateErrors[itemId].stack}`))
        }
        const decryptErrorsByField = get(STATE.errors[listKey], 'decrypt')
        if (decryptErrorsByField) {
            console.log(chalk.redBright('   Decrypt errors:'))
        }
        for (const field in decryptErrorsByField) {
            console.log(chalk.redBright(`   - ${listKey}.${field}:`))
            for (const id in decryptErrorsByField[field]) {
                console.log(chalk.red(`     - ${id}: ${decryptErrorsByField[field][id].stack}`))
            }
        }
    }
}

program.option('-a --all', 're encrypt all fields of EncryptedText type in all lists', false)
program.option('-i --include <listKey>', `Collection of <listKey> divided by space.
    If passed, only these lists will be re encrypted. Works only with --all = false`, null)
program.option('-e --exclude <listKey>', 'Same as --include, but works only with --app = true and determines\n ' +
    'models which should not be modified', null)
program.option('--from-versions <versions>', 'Collection of versoin ids, which you need to re encrypt. If not passed, all versions are re encrypted', null)
program.description(`Re encrypts fields of type EncryptedText with old secrets to new secrets
NOTE: it only touches data, which was encrypted in existing versions. If old version was forgotten, this script won't tell, or might error
If there is data under field EncryptedText, which was not encrypted by field methods, script will skip it or will error
`)


async function main () {
    parseOptions()
    const index = path.resolve('./index.js')
    const { keystone } = await prepareKeystoneExpressApp(index)
    
    const listsWithEncryptedFieldsToReEncrypt = getDataToReEncrypt(keystone)
    logger.info({ msg: 're-encrypt-in-current-version', data: { app: getAppName() } })
    await keystone.connect()
    let i = 0
    for (const listFieldsPair of listsWithEncryptedFieldsToReEncrypt) {
        i++
        const listState = await processList(keystone, listFieldsPair)
        STATE.allCount += listState.allCount
        STATE.successCount += listState.successCount
        STATE.processedCount += listState.processedCount
        STATE.errorCount += listState.errorCount
        if (listState.decryptErrors) {
            set(STATE, `errors.${listFieldsPair.list.key}.decrypt`, listState.decryptErrors)
        }
        if (listState.updateErrors) {
            set(STATE, `errors.${listFieldsPair.list.key}.update`, listState.updateErrors)
        }
        console.log(chalk.green('--------------------------'))
        console.log(chalk.greenBright(`Processed lists: ${i}/${listsWithEncryptedFieldsToReEncrypt.length}`))
        logState(STATE)
    }
    logErrors()
}

main().then(() => process.exit(0)).catch((e) => {
    console.error(e)
    process.exit(1)
})
