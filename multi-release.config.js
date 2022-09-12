/**
 * @qiwi/multi-semantic-release config
 * Which allows publishing multiple packages with same pipeline
 */

const { readdirSync } = require('fs')
const path = require('path')

// NOTE: Use gitignore notation here instead of package name
const RELEASE_PACKAGES = ['packages/ui']

const getDirectories = source =>
    readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

const ignorePackages = getDirectories(path.join(__dirname, 'packages'))
    .map(folder => `packages/${folder}`)
    .filter(packageName => !RELEASE_PACKAGES.includes(packageName))

module.exports = {
    tagFormat: '${name}-v${version}',
    // All apps will be ignored
    // All packages except RELEASE_PACKAGES will be ignored
    ignorePackages: [
        'apps/**',
        ...ignorePackages,
    ],
}
