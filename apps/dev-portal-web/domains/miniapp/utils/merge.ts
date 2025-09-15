import { DEFAULT_B2C_LOGO_URL } from '@/domains/miniapp/constants/common'

import type { AllAppsQuery } from '@/gql'

export type AppInfo = {
    id: string
    name: string
    type: 'b2b' | 'b2c'
    logo?: string | null
}

// TODO: implement merge-sorted-arrays once B2B apps is added
export function mergeApps (data?: AllAppsQuery): Array<AppInfo> {
    if (!data) {
        return []
    }

    const apps: Array<AppInfo> = []
    const b2cApps = (data.b2c || [])

    for (const app of b2cApps) {
        if (app && app.name) {
            apps.push({ type: 'b2c', id: app.id, name: app.name, logo: app.logo?.publicUrl || DEFAULT_B2C_LOGO_URL })
        }
    }

    return apps
}