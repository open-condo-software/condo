export function getAppKeyPrefix (appName: string): string {
    const scopedName = appName.split('/').pop() as string

    return scopedName.replaceAll('-', '_').toLowerCase()
}

export function getAppPrefixedKey (key: string, keyPrefix: string): string {
    // NOTE: Skip empty key
    if (!key) return key
    // NOTE: Skip already prefixed keys
    if (key.startsWith(keyPrefix) || key.startsWith(`{${keyPrefix}`)) return key

    // NOTE: bull key "bull:<queueName>:suffix..." must become "{<keyPrefix>:bull:<queueName>}:suffix..."
    if (key.startsWith('bull:')) {
        const [bull, queueName, ...rest] = key.split(':')
        const cachedPart = [keyPrefix, bull, queueName].join(':')

        // NOTE: Rejoin is necessary since "rest" can possibly be empty
        return [`{${cachedPart}}`, ...rest].join(':')
    } else {
        return [keyPrefix, key].join(':')
    }
}