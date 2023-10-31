import type { AllAppsQuery } from '@/lib/gql'

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

    b2cApps.reduce((all, current) => {
        if (current && current.name) {
            all.push({ type: 'b2c', id: current.id, name: current.name, logo: current.logo?.publicUrl })
        }
        return all
    }, apps)

    return apps
}