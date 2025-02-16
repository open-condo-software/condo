import fs from 'fs'
import path from 'path'

import { faker } from '@faker-js/faker'
import tmp from 'tmp'

tmp.setGracefulCleanup()

function randomInt (min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
}

type MonorepoApp = {
    name: string
    location: string
}

type CreateAppOptions = {
    env?: Record<string, string>
}

export class Monorepo {
    rootDir = tmp.dirSync({
        unsafeCleanup: true,
    })
    apps: Array<MonorepoApp> = []

    destroy () {
        this.rootDir.removeCallback()
    }

    createApp (options?: CreateAppOptions): Monorepo {
        const scopedName = Array
            .from({ length: randomInt(1, 4) }, () => faker.random.alphaNumeric(randomInt(3, 7)))
            .join('-')

        const name = `@app/${scopedName}`
        const location = path.join(this.rootDir.name, 'apps', scopedName, 'package.json')

        fs.mkdirSync(path.dirname(location), { recursive: true })

        fs.writeFileSync(
            location,
            JSON.stringify({
                name,
                version: '0.0.0-development',
            }),
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

        this.apps.push({
            name,
            location,
        })

        return this
    }
}

export function createTestMonoRepo (): Monorepo {
    return new Monorepo()
}