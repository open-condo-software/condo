import { DEFAULT_B2C_LOGO_URL } from '@/domains/miniapp/constants/common'

import type { AllB2BAppsQuery, AllB2CAppsQuery } from '@/gql'

export type AppInfo = {
    id: string
    name: string
    type: 'b2b' | 'b2c'
    logo?: string | null
    createdAt: string
}

export function mergeApps (b2bApps?: AllB2BAppsQuery['b2b'], b2cApps?: AllB2CAppsQuery['b2c']): Array<AppInfo> {
    const apps: Array<AppInfo> = []

    for (const app of (b2bApps  || [])) {
        if (app && app.name) {
            apps.push({
                type: 'b2b',
                id: app.id,
                name: app.name,
                logo: app.logo?.publicUrl || DEFAULT_B2C_LOGO_URL,
                createdAt: app.createdAt || (new Date()).toISOString(),
            })
        }
    }

    for (const app of (b2cApps || [])) {
        if (app && app.name) {
            apps.push({
                type: 'b2c',
                id: app.id,
                name: app.name,
                logo: app.logo?.publicUrl || DEFAULT_B2C_LOGO_URL,
                createdAt: app.createdAt || (new Date()).toISOString(),
            })
        }
    }

    return apps.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}