export const IS_CLIENT_SIDE = typeof window !== 'undefined'
// TODO(DOMA-5084): add mobile clients env checks
export const IS_BROWSER_CLIENT = IS_CLIENT_SIDE

export const WEB_SPECIFIC_METHODS = [
    'CondoWebAppResizeWindow',
]

export const WEB_APP_METHODS = [
]
