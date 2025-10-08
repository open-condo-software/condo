import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const distPath = path.dirname(__filename)
export const PKG_ROOT = path.join(distPath, '../')
console.log('PKG_ROOT: ', PKG_ROOT)
export const DEFAULT_APP_NAME = 'my-condo-miniapp'

export const APP_TYPES = {
    server: 'server',
    client: 'client',
    ['full-stack']: 'full-stack',
} as const

export type AppType = keyof typeof APP_TYPES
export type AppTypeValue = (typeof APP_TYPES)[keyof typeof APP_TYPES]

export const TITLE_TEXT = `
 ▗▄▄▖▗▄▄▖ ▗▄▄▄▖ ▗▄▖▗▄▄▄▖▗▄▄▄▖     ▗▄▄▖ ▗▄▖ ▗▖  ▗▖▗▄▄▄   ▗▄▖     ▗▖  ▗▖▗▄▄▄▖▗▖  ▗▖▗▄▄▄▖ ▗▄▖ ▗▄▄▖ ▗▄▄▖ 
▐▌   ▐▌ ▐▌▐▌   ▐▌ ▐▌ █  ▐▌       ▐▌   ▐▌ ▐▌▐▛▚▖▐▌▐▌  █ ▐▌ ▐▌    ▐▛▚▞▜▌  █  ▐▛▚▖▐▌  █  ▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌
▐▌   ▐▛▀▚▖▐▛▀▀▘▐▛▀▜▌ █  ▐▛▀▀▘    ▐▌   ▐▌ ▐▌▐▌ ▝▜▌▐▌  █ ▐▌ ▐▌    ▐▌  ▐▌  █  ▐▌ ▝▜▌  █  ▐▛▀▜▌▐▛▀▘ ▐▛▀▘ 
▝▚▄▄▖▐▌ ▐▌▐▙▄▄▖▐▌ ▐▌ █  ▐▙▄▄▖    ▝▚▄▄▖▝▚▄▞▘▐▌  ▐▌▐▙▄▄▀ ▝▚▄▞▘    ▐▌  ▐▌▗▄█▄▖▐▌  ▐▌▗▄█▄▖▐▌ ▐▌▐▌   ▐▌   
`
