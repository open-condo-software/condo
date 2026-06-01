import { APP_TYPES, AppType } from '../consts.js'

export function isAppType (value: string): value is AppType {
    return Object.values(APP_TYPES).includes(value as AppType)
}
