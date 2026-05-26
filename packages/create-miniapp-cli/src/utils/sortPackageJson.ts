import { type PackageJson } from 'type-fest'

const TOP_LEVEL_ORDER = [
    'name',
    'version',
    'private',
    'description',
    'license',
    'repository',
    'author',
    'type',
    'exports',
    'bin',
    'files',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'resolutions',
]

function sortObject<TValue> (object: Record<string, TValue> | undefined): Record<string, TValue> | undefined {
    if (!object) return object

    return Object.fromEntries(
        Object.entries(object).sort(([left], [right]) => left.localeCompare(right)),
    )
}

export function sortPackageJson (packageJson: PackageJson): PackageJson {
    const sortedEntries = Object.entries(packageJson).sort(([left], [right]) => {
        const leftIndex = TOP_LEVEL_ORDER.indexOf(left)
        const rightIndex = TOP_LEVEL_ORDER.indexOf(right)

        if (leftIndex !== -1 || rightIndex !== -1) {
            if (leftIndex === -1) return 1
            if (rightIndex === -1) return -1
            return leftIndex - rightIndex
        }

        return left.localeCompare(right)
    })

    return {
        ...Object.fromEntries(sortedEntries),
        scripts: sortObject(packageJson.scripts),
        dependencies: sortObject(packageJson.dependencies),
        devDependencies: sortObject(packageJson.devDependencies),
        peerDependencies: sortObject(packageJson.peerDependencies),
    } as PackageJson
}
