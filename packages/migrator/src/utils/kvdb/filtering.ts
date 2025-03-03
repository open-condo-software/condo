import type { PackageInfoWithLocation } from '@/utils/packages'

const DEPS_TO_DETECT = ['ioredis', '@open-condo/keystone']

export function isAppUsingKV (pkg: PackageInfoWithLocation): boolean {
    const devDeps = Object.keys(pkg.devDependencies || {})
    const deps = Object.keys(pkg.dependencies || {})

    const allDeps = [...devDeps, ...deps]

    return DEPS_TO_DETECT.some(dep => allDeps.includes(dep))
}