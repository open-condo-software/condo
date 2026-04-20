const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const PUBLIC_REGISTRY = process.env.NPM_PUBLIC_REGISTRY || 'https://registry.npmjs.org'
const NPM_REGISTRY_SERVER = process.env.NPM_REGISTRY_SERVER
const NPM_AUTH_TOKEN = process.env.NPM_AUTH_TOKEN
const DRY_RUN = process.env.DRY_RUN !== 'false'
const LOCKFILE = process.env.YARN_LOCKFILE || path.join(process.cwd(), 'yarn.lock')

function encodePackageName (packageName) {
    return packageName.startsWith('@')
        ? `@${encodeURIComponent(packageName.slice(1))}`
        : encodeURIComponent(packageName)
}

function parseNpmResolution (resolution) {
    const marker = '@npm:'
    const markerIndex = resolution.lastIndexOf(marker)

    if (markerIndex === -1) return null

    const name = resolution.slice(0, markerIndex)
    const version = resolution.slice(markerIndex + marker.length).split('::')[0]

    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z-.]+)?$/.test(version)) return null

    return { name, version }
}

function getLockedPackages () {
    const lockfile = fs.readFileSync(LOCKFILE, 'utf8')
    const packages = new Map()

    for (const line of lockfile.split('\n')) {
        const match = line.match(/^\s+resolution:\s+"?([^"]+)"?\s*$/)
        if (!match) continue

        const parsed = parseNpmResolution(match[1])
        if (!parsed) continue

        const key = `${parsed.name}@${parsed.version}`
        packages.set(key, parsed)
    }

    return Array.from(packages.values()).sort((a, b) => {
        return `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)
    })
}

async function getMissingVersions (packages) {
    const metadataByPackage = new Map()
    const missing = []

    for (const pkg of packages) {
        if (!metadataByPackage.has(pkg.name)) {
            const response = await fetch(`${PUBLIC_REGISTRY}/${encodePackageName(pkg.name)}`)

            if (response.status === 404) {
                metadataByPackage.set(pkg.name, null)
            } else if (!response.ok) {
                throw new Error(`Failed to fetch ${pkg.name} metadata from ${PUBLIC_REGISTRY}: ${response.status} ${response.statusText}`)
            } else {
                metadataByPackage.set(pkg.name, await response.json())
            }
        }

        const metadata = metadataByPackage.get(pkg.name)
        if (!metadata || !metadata.versions || !metadata.versions[pkg.version]) {
            missing.push(pkg)
        }
    }

    return missing
}

function getNpmUserConfig () {
    if (!NPM_REGISTRY_SERVER) {
        throw new Error('NPM_REGISTRY_SERVER is required when DRY_RUN=false')
    }

    if (!NPM_AUTH_TOKEN) {
        throw new Error('NPM_AUTH_TOKEN is required when DRY_RUN=false')
    }

    const registryUrl = new URL(NPM_REGISTRY_SERVER)
    const npmrcPath = path.join(os.tmpdir(), `npm-prune-${process.pid}.npmrc`)

    fs.writeFileSync(npmrcPath, [
        `registry=${NPM_REGISTRY_SERVER}`,
        `//${registryUrl.host}${registryUrl.pathname === '/' ? '' : registryUrl.pathname}/:_authToken=${NPM_AUTH_TOKEN}`,
        'always-auth=true',
        '',
    ].join('\n'), { mode: 0o600 })

    return npmrcPath
}

function unpublishVersion (pkg, npmUserConfig) {
    const result = spawnSync('npm', [
        'unpublish',
        `${pkg.name}@${pkg.version}`,
        '--registry',
        NPM_REGISTRY_SERVER,
        '--loglevel',
        'warn',
    ], {
        encoding: 'utf8',
        env: {
            ...process.env,
            NPM_CONFIG_USERCONFIG: npmUserConfig,
        },
    })

    if (result.status !== 0) {
        throw new Error(`Failed to unpublish ${pkg.name}@${pkg.version}: ${result.stderr || result.stdout}`)
    }
}

async function main () {
    const packages = getLockedPackages()
    console.log(`Checking ${packages.length} locked npm package versions against ${PUBLIC_REGISTRY}`)

    const missing = await getMissingVersions(packages)
    if (!missing.length) {
        console.log('No unpublished package versions found')
        return
    }

    console.log(`Found ${missing.length} package versions missing from upstream:`)
    for (const pkg of missing) {
        console.log(`- ${pkg.name}@${pkg.version}`)
    }

    if (DRY_RUN) {
        console.log('DRY_RUN is enabled, npm registry storage was not changed')
        return
    }

    const npmUserConfig = getNpmUserConfig()

    try {
        for (const pkg of missing) {
            unpublishVersion(pkg, npmUserConfig)
            console.log(`Unpublished ${pkg.name}@${pkg.version} from ${NPM_REGISTRY_SERVER}`)
        }
    } finally {
        fs.rmSync(npmUserConfig, { force: true })
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
