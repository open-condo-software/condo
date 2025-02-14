import type { CommonOptions } from '@/utils/options'

import { extractEnvValue } from '@/utils/envs'
import { isAppUsingKV } from '@/utils/kvdb/filtering'
import { getKeyPrefix } from '@/utils/kvdb/keyPrefix'
import { getLogger } from '@/utils/logging'
import { findApps, isNameMatching } from '@/utils/packages'


type TaskInfo = {
    appName: string
    dbConnection: string
    prefixKey: string
}

const logger = getLogger()

export async function addAppsKVPrefixes (options: CommonOptions): Promise<void> {
    logger.info('Scanning file system to find apps...')
    const allApps = await findApps()
    const targetApps = allApps
        .filter(isAppUsingKV)
        .filter(pkg => isNameMatching(pkg, options.filter))
        .toSorted((a, b) => a.name.localeCompare(b.name))

    if (options.filter) {
        logger.info(`Found ${targetApps.length} apps using KV databases and matched filter:`)
    } else {
        logger.info(`Found ${targetApps.length} apps using KV databases:`)
    }

    targetApps.forEach(app => logger.info(`- ${app.name}`))

    logger.info('Extracting connection strings...')

    const connectionStrings = await Promise.all(targetApps.map(app => extractEnvValue(app, 'REDIS_URL')))

    const connectionsMap: Record<string, string> = Object.fromEntries(
        targetApps
            .map((pkg, idx) => [pkg.name, connectionStrings[idx]])
            .filter(([_, connection]) => typeof connection === 'string')
    )

    logger.info('Generating key prefixes for apps...')

    const appsToPrefix: Array<TaskInfo> = Object.entries(connectionsMap)
        .map(([appName, dbConnection]) => ({
            appName,
            dbConnection,
            prefixKey: getKeyPrefix(appName),
        }))

    logger.table({
        head: ['App name', 'DB url', 'Keys prefix'],
        data: appsToPrefix.map(task => [task.appName, task.dbConnection, task.prefixKey]),
    })

    const connectionsCounter: Record<string, Array<string>> = {}
    appsToPrefix.forEach((task) => {
        if (!connectionsCounter[task.dbConnection]) {
            connectionsCounter[task.dbConnection] = []
        }

        connectionsCounter[task.dbConnection].push(task.appName)
    })

    const conflicts = Object.values(connectionsCounter).filter(group => group.length > 1)

    if (conflicts.length) {
        const errorRows = [
            'Unable to migrate because multiple applications in the list share a common base.',
            'Correct the variable values or specify a more restrictive filter',
            'Conflicting apps:',
            ...conflicts.map(conflict => `- [${conflict.map(appName => `"${appName}"`).join(', ')}]`),
        ]

        errorRows.forEach((row) => logger.error(row))
        process.exit(126)
    }

    if (!options.yes) {
        const confirm = await logger.confirm('The following applications will be migrated. Check all information carefully before proceeding!')
        if (!confirm) {
            process.exit(0)
        }
    }

    const sleep = (t: number) => new Promise((res) => setTimeout(() => res(t), t))

    for (const task of appsToPrefix) {
        logger.info(`Staring migration ${task.appName} app`)

        for (let i = 0; i < 10; i++) {
            await sleep(1000)
            logger.updateLine(`Progress: ${i + 1}/10`)
        }

        logger.info(`${task.appName} successfully migrated`)
    }
}