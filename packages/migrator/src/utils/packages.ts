import { readFile } from 'fs/promises'

import { glob } from 'glob'
import { z } from 'zod'

const APP_NAME_REGEXP = /^@app\/[a-z-]+$/

const packageSchema = z.object({
    name: z.string(),
    devDependencies: z.record(z.string(), z.string()).optional(),
    dependencies: z.record(z.string(), z.string()).optional(),
})

export type PackageInfoWithLocation = z.infer<typeof packageSchema> & {
    location: string
}

function isNonNull<T> (data: T): data is NonNullable<T> {
    return (data !== null && data !== undefined)
}

async function _getPackageJson (location: string): Promise<PackageInfoWithLocation | null> {
    const buf = await readFile(location)
    const rawData = JSON.parse(buf.toString())
    const { success, data } = packageSchema.safeParse(rawData)

    return success ? { ...data, location } : null
}

function isAppPackage (pkg: PackageInfoWithLocation): boolean {
    return APP_NAME_REGEXP.test(pkg.name)
}

export async function findApps (): Promise<Array<PackageInfoWithLocation>> {
    const allPackagesPaths = await glob('**/package.json', {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**'],
        absolute: true,
    })

    const allPackageJsons = await Promise.all(allPackagesPaths.map(location => _getPackageJson(location)))

    return allPackageJsons.filter(isNonNull).filter(isAppPackage)
}

export function isNameMatching (pkg: PackageInfoWithLocation, filter?: Array<string>): boolean {
    if (!filter) {
        return true
    }

    const fullName = pkg.name
    const scopedName = fullName.split('/').pop()

    return filter.some(filterName => {
        // Full filter-> exact match
        if (filterName.startsWith('@')) {
            return fullName === filterName
        }

        return scopedName === filterName
    })
}
