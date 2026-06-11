import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const distPath = path.dirname(__filename)
export const PKG_ROOT = path.join(distPath, '../')
export const CONDO_ROOT = path.resolve(PKG_ROOT, '../../')
export const DEFAULT_APP_NAME = 'my-condo-miniapp'

export const APP_TYPES = {
    server: 'server',
    client: 'client',
    ['full-stack']: 'full-stack',
} as const

export type AppType = keyof typeof APP_TYPES
export type AppTypeValue = (typeof APP_TYPES)[keyof typeof APP_TYPES]

export const CLIENT_AUTH_TYPES = {
    none: 'none',
    oidc: 'oidc',
} as const

export type ClientAuthType = keyof typeof CLIENT_AUTH_TYPES
export type ClientAuthTypeValue = (typeof CLIENT_AUTH_TYPES)[keyof typeof CLIENT_AUTH_TYPES]

export const DEFAULT_APP_RESOURCES = {
    cpu: {
        default: '250m',
        development: '250m',
        production :'500m',
    },
    memory: {
        default: '512Mi',
        development: '1024Mi',
        production: '1024Mi',
    }, 
}

export const DEFAULT_MAX_OLD_SPACE = {
    default: 256,
    development: 512,
    production: 768,
}

export type ENVS_TYPE = 'prod' | 'dev' | 'review'

export const TITLE_TEXT = `
 ▗▄▄▖▗▄▄▖ ▗▄▄▄▖ ▗▄▖▗▄▄▄▖▗▄▄▄▖     ▗▄▄▖ ▗▄▖ ▗▖  ▗▖▗▄▄▄   ▗▄▖     ▗▖  ▗▖▗▄▄▄▖▗▖  ▗▖▗▄▄▄▖ ▗▄▖ ▗▄▄▖ ▗▄▄▖ 
▐▌   ▐▌ ▐▌▐▌   ▐▌ ▐▌ █  ▐▌       ▐▌   ▐▌ ▐▌▐▛▚▖▐▌▐▌  █ ▐▌ ▐▌    ▐▛▚▞▜▌  █  ▐▛▚▖▐▌  █  ▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌
▐▌   ▐▛▀▚▖▐▛▀▀▘▐▛▀▜▌ █  ▐▛▀▀▘    ▐▌   ▐▌ ▐▌▐▌ ▝▜▌▐▌  █ ▐▌ ▐▌    ▐▌  ▐▌  █  ▐▌ ▝▜▌  █  ▐▛▀▜▌▐▛▀▘ ▐▛▀▘ 
▝▚▄▄▖▐▌ ▐▌▐▙▄▄▖▐▌ ▐▌ █  ▐▙▄▄▖    ▝▚▄▄▖▝▚▄▞▘▐▌  ▐▌▐▙▄▄▀ ▝▚▄▞▘    ▐▌  ▐▌▗▄█▄▖▐▌  ▐▌▗▄█▄▖▐▌ ▐▌▐▌   ▐▌   
`
