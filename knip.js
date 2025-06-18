const fs = require('fs')
const path = require('path')

const { glob } = require('glob')

function _extractPackageInfo (packageJsonPath) {
    const pkgInfo = JSON.parse(fs.readFileSync(packageJsonPath).toString())

    return {
        devDependencies: pkgInfo.devDependencies || {},
        dependencies: pkgInfo.dependencies || {},
        name: pkgInfo.name,
    }
}

function hasDependency (packageJsonPath, dependency) {
    const { dependencies, devDependencies } = _extractPackageInfo(packageJsonPath)

    return Object.keys(dependencies).includes(dependency) || Object.keys(devDependencies).includes(dependency)
}

function hasPath (packageJsonPath, relativePath) {
    const packageDir = path.dirname(packageJsonPath)

    const files = glob.sync(relativePath, {
        cwd: packageDir,
        ignore: ['**/node_modules/**'],
    })

    return Boolean(files.length)
}

function getMajorRequirement (packageJsonPath, depName) {
    const { dependencies, devDependencies } = _extractPackageInfo(packageJsonPath)
    if (!dependencies[depName] && !devDependencies[depName]) return null

    const requirement = dependencies[depName] || devDependencies[depName]

    const majorPart = requirement.split('.')[0]
    const clearedPart = majorPart.replace(/\D+/g, '')
    const majorVersion = parseInt(clearedPart)

    return Number.isNaN(majorVersion) ? null : majorVersion
}

function isApp (packageJsonPath) {
    const packageDir = path.dirname(packageJsonPath)
    const parentDir = path.dirname(packageDir)
    return path.basename(parentDir) === 'apps'
}

function isKSApp (packageJsonPath) {
    return isApp(packageJsonPath) && hasDependency(packageJsonPath, '@open-condo/keystone')
}

function getPackageDir (packageJsonPath) {
    return path.dirname(path.relative(__dirname, packageJsonPath))
}

function hasName (packageJsonPath, packageName) {
    const { name } = _extractPackageInfo(packageJsonPath)

    return name === packageName
}

function isFileContains (packageJsonPath, filePath, searchContent) {
    // NOTE: controlled environment
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const combinedPath = path.join(path.dirname(packageJsonPath), filePath)
    if (!fs.existsSync(combinedPath)) return false

    const content = fs.readFileSync(combinedPath).toString()

    return content.includes(searchContent)
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
        'apps/insurance': {
            ignoreDependencies: ['@graphql-codegen/typescript'],
        },
        'apps/resident-app': {
            entry: ['domains/common/utils/sw.ts', 'domains/telegram-bot/utils/bot.js', 'domains/telegram-bot/middlewares/i18n.js'],
        },
        'packages/icons': {
            ignoreDependencies: ['@svgr/plugin-svgo', '@svgr/plugin-prettier', '@svgr/plugin-jsx'],
        },
        'packages/keystone': {
            entry: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
        },
        'packages/ui': {
            ignoreDependencies: [
                /storybook/,
                'style-loader',
                'chromatic',
                'token-transformer',
            ],
            webpack: {
                config: [
                    'webpack.common.js',
                    'webpack.dev.js',
                    'webpack.prod.js',
                ],
            },
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
            packageConfig.entry.push('index.js', 'admin-ui/index.js', 'bin/**/*.js')
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

        // NODE: requireTs app util to import ts constants into next.config.js
        // TODO: move this util to package, add to specific package ignore and remove this rule
        if (isApp(packageJsonPath) && hasPath(packageJsonPath, '**/requireTs.js')) {
            if (hasDependency(packageJsonPath, '@babel/preset-typescript')) {
                packageConfig.ignoreDependencies.push('@babel/preset-typescript')
            }
            if (hasDependency(packageJsonPath, '@babel/preset-env')) {
                packageConfig.ignoreDependencies.push('@babel/preset-env')
            }
        }

        // Raw-loader, currently used only for messaging
        if (isApp(packageJsonPath) && hasDependency(packageJsonPath, 'raw-loader')) {
            // TODO: clean raw-loader from unused apps
            // if (hasPath(packageJsonPath, 'lang/**/*.njk')) {
            packageConfig.ignoreDependencies.push('raw-loader')
            // }
        }

        // old Next.js apps requires webpack4 not to compete with webpack5 from UI-kit
        if (hasDependency(packageJsonPath, 'webpack') && hasDependency(packageJsonPath, 'next')) {
            if (getMajorRequirement(packageJsonPath, 'next') <= 9) {
                packageConfig.ignoreDependencies.push('webpack')
            }
        }

        // apollo uses rollup + babel to build
        // TODO: think about migrating to zero-config tsup
        if (hasName(packageJsonPath, '@open-condo/apollo') && hasPath(packageJsonPath, 'rollup.config.mjs')) {
            for (const depName of ['@babel/preset-react', 'babel-core', 'babel-loader']) {
                if (hasDependency(packageJsonPath, depName)) {
                    packageConfig.ignoreDependencies.push(depName)
                }
            }
        }

        // icons / ui kit uses babel + webpack to build
        if (
            (hasName(packageJsonPath, '@open-condo/icons') || hasName(packageJsonPath, '@open-condo/ui')) &&
            hasPath(packageJsonPath, '.babelrc')
        ) {
            if (hasDependency(packageJsonPath, 'babel')) {
                packageConfig.ignoreDependencies.push('babel')
            }
        }

        // webpack-cli required for libs built with webpack
        if (hasDependency(packageJsonPath, 'webpack-cli') && hasPath(packageJsonPath, 'webpack.*.js')) {
            packageConfig.ignoreDependencies.push('webpack-cli')
        }

        // ts-node is required for some GQL-codegen
        if (isApp(packageJsonPath) && hasDependency(packageJsonPath, 'ts-node') && hasDependency(packageJsonPath, 'next') && isFileContains(packageJsonPath, 'codegen.ts', 'ts-node/register')) {
            packageConfig.ignoreDependencies.push('ts-node')
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
