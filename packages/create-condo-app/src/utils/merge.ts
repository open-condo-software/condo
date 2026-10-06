function mergeDependencies (existingDeps?: Record<string, string>, newDeps?: Record<string, string>): Record<string, string> {
    const keys = new Set([...Object.keys(existingDeps || {}), ...Object.keys(newDeps || {})])
    const sortedKeys = Array.from(keys).toSorted()
    return sortedKeys.reduce((acc, key) => {
        acc[key] = (newDeps?.[key] ?? existingDeps?.[key]) as string
        return acc
    }, {} as Record<string, string>)
}

export function mergePackageJson (existingContent: string, newContent: string): string {
    const existingParsed = JSON.parse(existingContent)
    const newParsed = JSON.parse(newContent)

    const finalObj = {
        ...existingParsed,
        ...newParsed,
    }

    for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (Object.hasOwn(finalObj, key)) {
            finalObj[key] = mergeDependencies(existingParsed[key], newParsed[key])
        }
    }

    for (const key of ['scripts', 'files', 'keywords']) {
        if (Object.hasOwn(existingParsed, key) && Object.hasOwn(newParsed, key)) {
            if (Array.isArray(existingParsed[key])) {
                finalObj[key] = [...existingParsed[key], ...newParsed[key]]
            } else {
                finalObj[key] = { ...existingParsed[key], ...newParsed[key] }
            }
        }
    }

    return JSON.stringify(finalObj, null, 2)
}

export function mergeTranslations (existingContent: string, newContent: string): string {
    const existing = JSON.parse(existingContent)
    const newContentJson = JSON.parse(newContent)
    // TODO: lint translations to keep order
    return JSON.stringify({ ...existing, ...newContentJson }, null, 2)
}