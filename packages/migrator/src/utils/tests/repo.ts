import fs from 'fs'
import path from 'path'

import { faker } from '@faker-js/faker'
import tmp from 'tmp'

import type { PackageInfoWithLocation } from '@/utils/packages'

tmp.setGracefulCleanup()

function randomInt (min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
}

type CreateAppOptions = {
    name?: string
    env?: Record<string, string>
    devDependencies?: Record<string, string>
    dependencies?: Record<string, string>
}

export class Monorepo {
    rootDir = tmp.dirSync({
        unsafeCleanup: true,
    })
    apps: Array<PackageInfoWithLocation> = []

    destroy (): void {
        this.rootDir.removeCallback()
    }

    createApp (options?: CreateAppOptions): Monorepo {
        const scopedName = Array
            .from({ length: randomInt(1, 4) }, () => faker.random.alphaNumeric(randomInt(3, 7)))
            .join('-')

        const name = options?.name ?? `@app/${scopedName}`
        // NOTE: controlled traversal
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        const location = path.join(this.rootDir.name, 'apps', options?.name ?? scopedName, 'package.json')

        fs.mkdirSync(path.dirname(location), { recursive: true })

        const appData = Object.fromEntries([
            ['name', name],
            ['version', '0.0.0-development'],
            ['devDependencies', options?.devDependencies],
            ['dependencies', options?.dependencies],
        ].filter(([_, value]) => Boolean(value)))

        fs.writeFileSync(
            location,
            JSON.stringify(appData),
        )

        if (options?.env) {
            const envContent = Object.entries(options.env)
                .map(([key, value]) => `${key.toUpperCase()}=${value}`)
                .join('\n')

            fs.writeFileSync(
                path.join(path.dirname(location), '.env'),
                envContent
            )
        }
        
        const omittedVersionData = 
            Object.fromEntries(
                Object.entries(appData).filter(([key]) => key !== 'version')
            ) as Omit<PackageInfoWithLocation, 'location'> 

        this.apps.push({
            ...omittedVersionData,
            location,
        })

        return this
    }
}

export function createTestMonoRepo (): Monorepo {
    return new Monorepo()
}