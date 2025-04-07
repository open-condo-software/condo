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

function isKSApp (packageJsonPath) {
    return hasDependency(packageJsonPath, '@open-condo/keystone')
}

function getPackageDir (packageJsonPath) {
    return path.dirname(path.relative(__dirname, packageJsonPath))
}

async function config () {
    const allPackagesPaths = await glob('apps/*/package.json', {
        ignore: ['**/node_modules/**'],
        absolute: true,
    })

    const appsWorkspaces = Object.fromEntries(allPackagesPaths.map(packageJsonPath => {
        /** @type {import('knip').KnipConfig['workspaces'][string]} */
        const appConfig = {
            entry: [],
            ignoreDependencies: [],
        }

        if (isKSApp(packageJsonPath) && Array.isArray(appConfig.entry)) {
            appConfig.entry.push('index.js', 'admin-ui/index.js')
        }

        if (hasDependency(packageJsonPath, 'jest')) {
            if (isKSApp(packageJsonPath)) {
                appConfig.ignoreDependencies.push('jest-jasmine2')
            }
        }

        return [getPackageDir(packageJsonPath), appConfig]
    }))

    /** @type {import('knip').KnipConfig} */
    const mergedConfig =  {
        include: ['dependencies'],
        workspaces: {
            ...appsWorkspaces,
        },
    }

    return mergedConfig
}

module.exports = config