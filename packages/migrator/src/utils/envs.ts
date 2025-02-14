import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'

import { parse } from 'dotenv'

import type { PackageInfoWithLocation } from './packages'


export async function extractEnvValue (pkg: PackageInfoWithLocation, key: string): Promise<string | undefined> {
    const pkgDirPath = path.dirname(pkg.location)

    let value = process.env[key]

    const envFileLocation = path.join(pkgDirPath, '.env')

    if (existsSync(envFileLocation)) {
        const envBuf = await readFile(envFileLocation)
        const env = parse(envBuf)

        if (env[key]) {
            value = env[key]
        }
    }

    return value
}