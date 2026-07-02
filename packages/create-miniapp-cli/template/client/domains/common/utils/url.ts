export const isSafeUrl = (value: string): boolean => {
    return value.startsWith('/') && !value.startsWith('//')
}
