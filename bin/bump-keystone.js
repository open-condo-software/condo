const fs = require('fs')

const { glob } = require('glob')

const _targetScope = '@open-keystone'
const _cachedVersions = new Map()

async function getLatestVersion (packageName) {
    if (!_cachedVersions.has(packageName)) {
        const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`)
        const { version } = await response.json()
        _cachedVersions.set(packageName, version)
    }

    return _cachedVersions.get(packageName)
}

async function updateDeps (deps) {
    let changed = false
    for (const [pkgName, oldRequirement] of Object.entries(deps)) {
        if (pkgName.startsWith(_targetScope)) {
            const latestVersion = await getLatestVersion(pkgName)
            const newRequirement = `^${latestVersion}`
            deps[pkgName] = newRequirement
            if (newRequirement !== oldRequirement) {
                changed = true
            }
        }
    }

    return changed
}

async function main () {
    const packagePaths = await glob('**/package.json', {
        ignore: '**/node_modules/**',
        absolute: true,
    })

    for (const pkgPath of packagePaths) {
        const content = JSON.parse(fs.readFileSync(pkgPath, { encoding: 'utf-8' }))
        let changed = false
        if (content?.dependencies) {
            changed ||= await updateDeps(content.dependencies)
        }
        if (content?.devDependencies) {
            changed ||= await updateDeps(content.devDependencies)
        }

        if (changed) {
            fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2) + '\n')
        }
    }
}

main().then(() => console.log('ALL DONE!'))