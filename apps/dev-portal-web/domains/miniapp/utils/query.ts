import { AppEnvironment } from '@/gql'

export function getCurrentPage (queryPage?: string | Array<string>): number {
    if (!queryPage || Array.isArray(queryPage)) {
        return 1
    }
    const page = parseInt(queryPage)
    if (Number.isNaN(page)) {
        return 1
    }

    return Math.max(1, page)
}

export function getEnvironment (queryValue?: string | Array<string>): AppEnvironment {
    if (!queryValue || Array.isArray(queryValue)) {
        return AppEnvironment.Development
    }
    if (queryValue === AppEnvironment.Production) {
        return AppEnvironment.Production
    }

    return AppEnvironment.Development
}