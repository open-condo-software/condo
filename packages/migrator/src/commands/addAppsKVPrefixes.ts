import type { PackageInfoWithLocation } from '@/utils/files'

import { findApps } from '@/utils/files'

const DEPS_TO_DETECT = ['ioredis', '@open-condo/keystone']

function isAppUsingKV (pkg: PackageInfoWithLocation): boolean {
    const devDeps = Object.keys(pkg.devDependencies || {})
    const deps = Object.keys(pkg.dependencies || {})

    const allDeps = [...devDeps, ...deps]

    return DEPS_TO_DETECT.some(dep => allDeps.includes(dep))
}

export async function addAppsKVPrefixes (): Promise<void> {
    const allApps = await findApps()
    const targetApps = allApps.filter(isAppUsingKV)
    targetApps.sort((a, b) => a.name.localeCompare(b.name))
    console.log(JSON.stringify(targetApps.map(app => app.name), null, 2))
    console.log(targetApps.length)

}