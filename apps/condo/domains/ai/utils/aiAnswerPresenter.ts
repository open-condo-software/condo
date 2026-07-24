const SUGGESTIONS_OPEN_PREFIX = '[[SUGGESTIONS'
const SUGGESTIONS_CLOSE_PREFIX = '[[/SUGGESTIONS'
const SUGGESTIONS_BLOCK_REGEX = /\[\[SUGGESTIONS\]\]([\s\S]*?)\[\[\/SUGGESTIONS\]\]/m

const CALLING_PREFIX = 'Calling'
// n8n / LangChain tool trace: "Calling <tool> with input: { ... }"
const TOOL_CALL_HEADER_REGEX = /Calling\s+\S+\s+with\s+input:\s*/g

export type SuggestionsFailureReason = 'missing_block' | 'empty_after_parse' | 'service_text_leaked'

export type ParsedAssistantAnswer = {
    text: string
    suggestions: string[]
    suggestionsFailureReason?: SuggestionsFailureReason
}

function indexOfSuggestionsMarkerStart (text: string): number {
    const completeOpenIndex = text.indexOf(SUGGESTIONS_OPEN_PREFIX)
    if (completeOpenIndex >= 0) {
        return completeOpenIndex
    }

    for (let size = SUGGESTIONS_OPEN_PREFIX.length - 1; size >= 2; size--) {
        const partial = SUGGESTIONS_OPEN_PREFIX.slice(0, size)
        if (text.endsWith(partial)) {
            return text.length - size
        }
    }

    const closeIndex = text.indexOf(SUGGESTIONS_CLOSE_PREFIX)
    if (closeIndex >= 0) {
        return closeIndex
    }

    for (let size = SUGGESTIONS_CLOSE_PREFIX.length - 1; size >= 2; size--) {
        const partial = SUGGESTIONS_CLOSE_PREFIX.slice(0, size)
        if (text.endsWith(partial)) {
            return text.length - size
        }
    }

    return -1
}

/**
 * End index (exclusive) of a JSON object starting at text[0] === '{',
 * or -1 if the object is incomplete / invalid for stripping.
 */
function findEndOfBalancedJsonObject (text: string): number {
    if (!text || text[0] !== '{') return -1

    let depth = 0
    let inString = false
    let isEscaped = false

    for (let i = 0; i < text.length; i++) {
        const char = text[i]

        if (inString) {
            if (isEscaped) {
                isEscaped = false
                continue
            }
            if (char === '\\') {
                isEscaped = true
                continue
            }
            if (char === '"') {
                inString = false
            }
            continue
        }

        if (char === '"') {
            inString = true
            continue
        }
        if (char === '{') {
            depth += 1
            continue
        }
        if (char === '}') {
            depth -= 1
            if (depth === 0) {
                return i + 1
            }
        }
    }

    return -1
}

function isPartialToolCallTrace (line: string): boolean {
    if (!line) return false

    for (let size = CALLING_PREFIX.length; size >= 1; size--) {
        if (line === CALLING_PREFIX.slice(0, size)) {
            return true
        }
    }

    if (/^Calling\s+\S*$/.test(line)) {
        return true
    }

    if (/^Calling\s+\S+\s+with(?:\s+input)?$/.test(line)) {
        return true
    }

    const headerMatch = /^(Calling\s+\S+\s+with\s+input:\s*)/.exec(line)
    if (!headerMatch) {
        return false
    }

    const rest = line.slice(headerMatch[1].length)
    if (!rest) {
        return true
    }
    if (rest[0] !== '{') {
        return true
    }

    return findEndOfBalancedJsonObject(rest) < 0
}

function stripServiceToolCallLines (text: string): string {
    let result = ''
    let lastIndex = 0

    TOOL_CALL_HEADER_REGEX.lastIndex = 0
    let headerMatch = TOOL_CALL_HEADER_REGEX.exec(text)
    while (headerMatch) {
        const headerStart = headerMatch.index
        const headerEnd = headerMatch.index + headerMatch[0].length
        const jsonEnd = findEndOfBalancedJsonObject(text.slice(headerEnd))

        if (jsonEnd < 0) {
            headerMatch = TOOL_CALL_HEADER_REGEX.exec(text)
            continue
        }

        result += text.slice(lastIndex, headerStart)
        lastIndex = headerEnd + jsonEnd
        TOOL_CALL_HEADER_REGEX.lastIndex = lastIndex
        headerMatch = TOOL_CALL_HEADER_REGEX.exec(text)
    }

    result += text.slice(lastIndex)
    result = result.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n')

    const lastNewlineIndex = result.lastIndexOf('\n')
    const lastLine = lastNewlineIndex >= 0 ? result.slice(lastNewlineIndex + 1) : result
    if (isPartialToolCallTrace(lastLine)) {
        return (lastNewlineIndex >= 0 ? result.slice(0, lastNewlineIndex) : '').trimEnd()
    }

    return result
}

function stripSuggestionsForDisplay (text: string): string {
    const completeBlockMatch = SUGGESTIONS_BLOCK_REGEX.exec(text)
    if (completeBlockMatch) {
        return text.replace(SUGGESTIONS_BLOCK_REGEX, '').trimEnd()
    }

    const markerStartIndex = indexOfSuggestionsMarkerStart(text)
    if (markerStartIndex >= 0) {
        return text.slice(0, markerStartIndex).trimEnd()
    }

    return text
}

export function toDisplayText (rawAnswer: string): string {
    if (!rawAnswer || typeof rawAnswer !== 'string') {
        return ''
    }

    return stripSuggestionsForDisplay(stripServiceToolCallLines(rawAnswer)).trimEnd()
}

// Turns raw model output into chat UI fields (clean text + suggestion chips).
// Kept in utils so streaming buffer, finalize, and tests share one parser outside React.
export function parseAssistantAnswer (answer: string): ParsedAssistantAnswer {
    if (!answer || typeof answer !== 'string') {
        return { text: '', suggestions: [], suggestionsFailureReason: 'missing_block' }
    }

    const match = SUGGESTIONS_BLOCK_REGEX.exec(answer)
    if (!match) {
        const hasSuggestionMarkers = answer.includes(SUGGESTIONS_OPEN_PREFIX) || answer.includes(SUGGESTIONS_CLOSE_PREFIX)
        return {
            text: toDisplayText(answer),
            suggestions: [],
            suggestionsFailureReason: hasSuggestionMarkers ? 'service_text_leaked' : 'missing_block',
        }
    }

    const suggestions = match[1]
        .split('\n')
        .flatMap((line) => {
            const trimmed = line.trim()
            if (!trimmed.startsWith('& ')) return []
            const suggestion = trimmed.slice(2).trim()
            return suggestion ? [suggestion] : []
        })

    const textWithoutSuggestions = stripServiceToolCallLines(
        answer.replace(SUGGESTIONS_BLOCK_REGEX, ''),
    ).trimEnd()
    const hasLeakedServiceText = textWithoutSuggestions.includes(SUGGESTIONS_OPEN_PREFIX)
        || textWithoutSuggestions.includes(SUGGESTIONS_CLOSE_PREFIX)
    const parsedSuggestions = suggestions.slice(0, 3)

    let suggestionsFailureReason: SuggestionsFailureReason | undefined
    if (hasLeakedServiceText) {
        suggestionsFailureReason = 'service_text_leaked'
    } else if (parsedSuggestions.length === 0) {
        suggestionsFailureReason = 'empty_after_parse'
    }

    return {
        text: textWithoutSuggestions,
        suggestions: parsedSuggestions,
        suggestionsFailureReason,
    }
}
