

type TranslationGroup = {
    type: 'global' | 'components' | 'pages'
    prefix: string
    keys: Array<string>
}


function sortGroups (groups: TranslationGroup[]): TranslationGroup[] {
    const typeOrder = { global: 0, components: 1, pages: 2 }

    return groups.toSorted((a, b) => {
        // First by type
        const typeDiff = typeOrder[a.type] - typeOrder[b.type]
        if (typeDiff !== 0) return typeDiff

        // Then by prefix alphabetically
        return a.prefix.localeCompare(b.prefix)
    })
}


function _getCommonPrefix (strings: Array<string>): string {
    if (!strings.length) return ''
    const minLength = Math.min(...strings.map(s => s.length))
    for (let i = 0; i < minLength; i++) {
        const isEqual = strings.every(s => s[i] === strings[0][i])
        if (!isEqual) return strings[0].slice(0, i)
    }

    return strings[0].slice(0, minLength)
}

function parseGroupedTranslations (content: string, existingGroups: Array<TranslationGroup>): Array<TranslationGroup> {
    const lines = content.split('\n')
    const groups: TranslationGroup[] = existingGroups.map(group => ({ ...group }))
    let currentGroup: TranslationGroup | null = null

    for (const line of lines) {
        const trimmed = line.trim()

        if (!trimmed || trimmed === '{' || trimmed === '}') {
            // NOTE: Empty line marks end of current group
            if (currentGroup) {
                currentGroup = null
            }
            continue
        }

        const keyMatch = trimmed.match(/^"([^"]+)":/)
        if (!keyMatch) {
            throw new Error(`Invalid key format: ${trimmed}`)
        }

        const key = keyMatch[1]
        const groupType = key.split('.')[0] as TranslationGroup['type']
        if (!currentGroup) {
            // NOTE: New group detected, lets try to find existing group
            const foundGroup = groups.find(g => g.type === groupType && key.startsWith(`${g.prefix}.`))
            if (foundGroup) {
                currentGroup = foundGroup
            } else {
                currentGroup = { type: groupType, prefix: '', keys: [] }
                groups.push(currentGroup)
            }
        }

        if (!currentGroup.keys.includes(key)) {
            currentGroup.keys.push(key)
        }
    }

    if (currentGroup && currentGroup.keys.length > 0) {
        groups.push(currentGroup)
    }

    for (const group of groups) {
        group.prefix = _getCommonPrefix(group.keys)
    }

    return groups
}

export function mergeTranslations (existingContent: string, newContent: string): string {
    const existing = JSON.parse(existingContent)
    const newContentJson = JSON.parse(newContent)

    // Parse existing groups to preserve structure
    const existingGroups = parseGroupedTranslations(existingContent, [])
    const allGroups = parseGroupedTranslations(newContent, existingGroups)

    // Merge translations
    const allTranslations = { ...existing, ...newContentJson }

    const sortedGroups = sortGroups(allGroups)

    // Build output with empty lines between groups
    const lines: string[] = ['{']

    for (let i = 0; i < sortedGroups.length; i++) {
        const activeGroup = sortedGroups[i]
        const isLastGroup = (i === sortedGroups.length - 1)
        for (let j = 0; j < activeGroup.keys.length; j++) {
            const key = activeGroup.keys[j]
            const value = allTranslations[key]
            const isLastLine = (j === activeGroup.keys.length - 1)
            const lineContent = `  "${key}": ${JSON.stringify(value)}`
            const lineEnd = isLastLine && isLastGroup
                ? ''
                : (isLastLine ? ',\n' : ',')
            lines.push(lineContent + lineEnd)
        }
    }

    lines.push('}')

    return lines.join('\n')
}