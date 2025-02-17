export function getAppKeyPrefix (appName: string): string {
    const scopedName = appName.split('/').pop() as string

    return scopedName.replaceAll('-', '_').toLowerCase()
}