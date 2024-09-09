export function isSSR (): boolean {
    return typeof window === 'undefined'
}

export function isDebug (): boolean {
    return process.env.NODE_ENV === 'development'
}
