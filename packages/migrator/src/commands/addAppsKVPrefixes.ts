import Table from 'cli-table3'

import type { CommonOptions } from '@/utils/options'

import { extractEnvValue } from '@/utils/envs'
import { isAppUsingKV } from '@/utils/kvdb/filtering'
import { getKeyPrefix } from '@/utils/kvdb/keyPrefix'
import { findApps, isNameMatching } from '@/utils/packages'


type TaskInfo = {
    appName: string
    dbConnection: string
    prefixKey: string
}

export async function addAppsKVPrefixes (options: CommonOptions): Promise<void> {
    const allApps = await findApps()
    const targetApps = allApps
        .filter(isAppUsingKV)
        .filter(pkg => isNameMatching(pkg, options.filter))
        .toSorted((a, b) => a.name.localeCompare(b.name))

    const connectionStrings = await Promise.all(targetApps.map(app => extractEnvValue(app, 'REDIS_URL')))

    const connectionsMap: Record<string, string> = Object.fromEntries(
        targetApps
            .map((pkg, idx) => [pkg.name, connectionStrings[idx]])
            .filter(([_, connection]) => typeof connection === 'string')
    )

    const appsToPrefix: Array<TaskInfo> = Object.entries(connectionsMap)
        .map(([appName, dbConnection]) => ({
            appName,
            dbConnection,
            prefixKey: getKeyPrefix(appName),
        }))

    const table = new Table({
        head: ['App name', 'DB url', 'Keys prefix'],
    })
    table.push(...appsToPrefix.map(task => [task.appName, task.dbConnection, task.prefixKey]))


    console.log(table.toString())
}