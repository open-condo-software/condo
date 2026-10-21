import Conf from 'conf'

import packageJson from '../../package.json'

type PkgInfo = {
    name: string
    version: string
}

type UpdateCache = {
    lastUpdate?: number
    latest?: string | null
}

type EvaluateCacheResult = {
    shouldCheck: boolean
    latest: string | null
}

type NPMResponse = {
    'dist-tags'?: {
        latest?: string
    }
}

type UpdateInfo = {
    latest: string | null
    fromCache: boolean
}

type PkgNameInfo = {
    full: string
    name: string
    scope: string | null
}

type UpdateCheckOptions = {
    // distTag: string
    cacheTtl: number
}

const DEFAULT_OPTIONS: UpdateCheckOptions = {
    cacheTtl: 3600 * 1000, // 1 hour in ms
}
const CACHE_KEY = 'updatesCache'

function compareVersions (a: string, b: string){
    return a.localeCompare(b, 'en-US', { numeric: true })
}

function encode (value: string) {
    return encodeURIComponent(value).replace(/^%40/, '@')
}

function getNameDetails (pkgName: string): PkgNameInfo {
    const spec: PkgNameInfo = {
        full: encode(pkgName),
        name: '',
        scope: null,
    }

    if (pkgName.includes('/')) {
        const parts = pkgName.split('/')

        spec.scope = parts[0]
        spec.name = parts[1]
    } else {
        spec.scope = null
        spec.name = pkgName
    }

    return spec
}

function evaluateCache (checkTime: number, ttlMs: number): EvaluateCacheResult {
    const conf = new Conf({ projectName: packageJson.name })
    const { lastUpdate, latest } = (conf.get(CACHE_KEY) || {}) as UpdateCache
    if (!lastUpdate || lastUpdate + ttlMs < checkTime) {
        return {
            shouldCheck: true,
            latest: null,
        }
    }

    return {
        shouldCheck: false,
        latest: latest ?? null,
    }
}

async function getMostRecent ({ full }: { full: string }) {
    const registryUrl = 'https://registry.npmjs.org'
    const url = `${registryUrl}/${full}`

    const response = await fetch(url, {
        headers: {
            accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
        },
        signal: AbortSignal.timeout(3_000),
    })

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
    }

    const spec = await response.json() as NPMResponse

    const version = spec?.['dist-tags']?.latest

    if (!version) {
        throw new Error('Distribution tag latest is not available')
    }

    return version
}

export async function checkForUpdates (pkg: PkgInfo, opts?: Partial<UpdateCheckOptions>): Promise<UpdateInfo | null> {
    const details = getNameDetails(pkg.name)
    const config = Object.assign({}, DEFAULT_OPTIONS, opts)
    const checkTime = Date.now()

    let latest: string | null = null
    let shouldCheck: boolean = true;

    ({ shouldCheck, latest } = evaluateCache(checkTime, config.cacheTtl))

    if (shouldCheck) {
        latest = await getMostRecent(details)

        const conf = new Conf({ projectName: packageJson.name })
        conf.set(CACHE_KEY, {
            latest,
            lastUpdate: checkTime,
        })
    }

    const comparison = compareVersions(pkg.version, latest ?? '')

    if (comparison === -1) {
        return {
            latest,
            fromCache: !shouldCheck,
        }
    }

    return null
}