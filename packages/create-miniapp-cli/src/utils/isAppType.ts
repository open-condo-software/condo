import { APP_TYPES, AppType } from '@cli/consts.js'

export function isAppType (value: string): value is AppType {
    return Object.values(APP_TYPES).includes(value as AppType)
}