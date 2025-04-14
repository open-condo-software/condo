const fs = require('fs')
const path = require('path')

const { glob } = require('glob')

function _extractAppDeps (packageJsonPath) {
    const pkgInfo = JSON.parse(fs.readFileSync(packageJsonPath).toString())
    const devDependencies = Object.keys(pkgInfo.devDependencies || {})
    const dependencies = Object.keys(pkgInfo.dependencies || {})

    return { devDependencies, dependencies }
}

function hasDependency (packageJsonPath, dependency) {
    const { dependencies, devDependencies } = _extractAppDeps(packageJsonPath)

    return dependencies.includes(dependency) || devDependencies.includes(dependency)
}

function hasPath (packageJsonPath, relativePath) {
    const combinedPath = path.join(path.dirname(packageJsonPath), relativePath)

    return fs.existsSync(combinedPath)
}

function isApp (packageJsonPath) {
    return path.basename(path.dirname(packageJsonPath)) === 'apps'
}

function isKSApp (packageJsonPath) {
    return isApp(packageJsonPath) && hasDependency(packageJsonPath, '@open-condo/keystone')
}

function getPackageDir (packageJsonPath) {
    return path.dirname(path.relative(__dirname, packageJsonPath))
}

function _arrayMerge (base, addition) {
    if (Array.isArray(base)) {
        if (Array.isArray(addition)) {
            return [...new Set([...base, ...addition])]
        }

        return base
    }

    return addition
}

/**
 * @param {Array<import('knip').KnipConfig['workspaces']>} configs
 */
function mergeWorkspaceConfigs (...configs) {
    /** @type import('knip').KnipConfig['workspaces'] */
    const mergedConfig = {}

    for (const combinedConfig of configs) {
        for (const [appPath, packageConfig] of Object.entries(combinedConfig)) {
            if (!mergedConfig[appPath]) {
                mergedConfig[appPath] = packageConfig
            } else {
                const existingConfig = mergedConfig[appPath]

                mergedConfig[appPath] = {
                    ...existingConfig,
                    ...packageConfig,
                    entry: _arrayMerge(existingConfig.entry, packageConfig.entry),
                    ignoreDependencies: _arrayMerge(existingConfig.ignoreDependencies, packageConfig.ignoreDependencies),
                }
            }
        }
    }

    return mergedConfig
}

async function config () {
    const allPackagesPaths = await glob('{apps,packages}/*/package.json', {
        ignore: ['**/node_modules/**'],
        absolute: true,
    })

    /** @type import('knip').KnipConfig['workspaces'] */
    const staticWorkspaces = {
        '.': {
            ignoreDependencies: [/commitlint/],
        },
        'packages/keystone': {
            entry: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
        },
    }

    /** @type import('knip').KnipConfig['workspaces'] */
    const dynamicWorkspaces = Object.fromEntries(allPackagesPaths.map(packageJsonPath => {
        /** @type {import('knip').KnipConfig['workspaces'][string] & { entry: Array<string> }} */
        const packageConfig = {
            entry: [],
            ignoreDependencies: [],
        }

        // KS app entry points
        if (isKSApp(packageJsonPath)) {
            packageConfig.entry.push('index.js', 'admin-ui/index.js', 'bin/*.js')
        }

        // Jest-specific packages
        if (hasDependency(packageJsonPath, 'jest')) {
            if (hasPath(packageJsonPath, 'jest.config.js') && hasDependency(packageJsonPath, 'jest-jasmine2')) {
                packageConfig.ignoreDependencies.push('jest-jasmine2')
            }

            if (hasDependency(packageJsonPath, '@types/jest') && (hasPath(packageJsonPath, 'tsconfig.json') || hasDependency(packageJsonPath, 'typescript'))) {
                packageConfig.ignoreDependencies.push('@types/jest')
            }
        }

        // typescript packages with modern exports
        // TODO: make check more strict by reading package.json exports fields
        if (!isApp(packageJsonPath) && hasPath(packageJsonPath, 'tsconfig.json') && hasPath(packageJsonPath, 'src')) {
            packageConfig.entry.push('src/**/*.ts')
        }

        return [getPackageDir(packageJsonPath), packageConfig]
    }))

    /** @type {import('knip').KnipConfig} */
    const mergedConfig =  {
        include: ['dependencies'],
        workspaces: mergeWorkspaceConfigs(dynamicWorkspaces, staticWorkspaces),
    }

    return mergedConfig
}

module.exports = config
