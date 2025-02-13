import Table from 'cli-table3'

import type { CommonOptions } from '@/utils/options'
import type { PackageInfoWithLocation } from '@/utils/packages'

import { extractEnvValue } from '@/utils/envs'
import { findApps, isNameMatching } from '@/utils/packages'

const DEPS_TO_DETECT = ['ioredis', '@open-condo/keystone']

function isAppUsingKV (pkg: PackageInfoWithLocation): boolean {
    const devDeps = Object.keys(pkg.devDependencies || {})
    const deps = Object.keys(pkg.dependencies || {})

    const allDeps = [...devDeps, ...deps]

    return DEPS_TO_DETECT.some(dep => allDeps.includes(dep))
}

function getPrefix (appName: string): string {
    const scopedName = appName.split('/').pop() as string

    return scopedName.replaceAll('-', '_').toLowerCase()
}

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
        .toSorted()

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
            prefixKey: getPrefix(appName),
        }))

    const table = new Table({
        head: ['App name', 'DB url', 'Keys prefix'],
    })
    table.push(...appsToPrefix.map(task => [task.appName, task.dbConnection, task.prefixKey]))


    // console.log(appsToPrefix)
}