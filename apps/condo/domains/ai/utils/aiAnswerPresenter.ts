const SUGGESTIONS_OPEN_PREFIX = '[[SUGGESTIONS'
const SUGGESTIONS_CLOSE_PREFIX = '[[/SUGGESTIONS'
const SUGGESTIONS_BLOCK_REGEX = /\[\[SUGGESTIONS\]\]([\s\S]*?)\[\[\/SUGGESTIONS\]\]/m

const CALLING_PREFIX = 'Calling'
// n8n / LangChain: "Calling <tool> with input: { ... }"
const TOOL_CALL_HEADER_REGEX = /Calling\s+.+?\s+with\s+input:\s*/g
const PARTIAL_TOOL_CALL_HEADER_REGEX = /^(Calling\s+.+?\s+with\s+input:\s*)/
// Strip any English "Calling …" agent traces
const CALLING_TRACE_REGEX = /Calling[^\n\u0400-\u04FF]*/g
const PARTIAL_CALLING_TRACE_REGEX = /^Calling\b/

export type SuggestionsFailureReason = 'missing_block' | 'empty_after_parse' | 'service_text_leaked'

export type ParsedAssistantAnswer = {
    text: string
    suggestions: string[]
    suggestionsFailureReason?: SuggestionsFailureReason
}

function indexOfTrailingPartialMarker (text: string, marker: string): number {
    for (let size = marker.length - 1; size >= 2; size--) {
        if (text.endsWith(marker.slice(0, size))) {
            return text.length - size
        }
    }
    return -1
}

function indexOfSuggestionsMarkerStart (text: string): number {
    const completeOpenIndex = text.indexOf(SUGGESTIONS_OPEN_PREFIX)
    if (completeOpenIndex >= 0) {
        return completeOpenIndex
    }

    const partialOpenIndex = indexOfTrailingPartialMarker(text, SUGGESTIONS_OPEN_PREFIX)
    if (partialOpenIndex >= 0) {
        return partialOpenIndex
    }

    const closeIndex = text.indexOf(SUGGESTIONS_CLOSE_PREFIX)
    if (closeIndex >= 0) {
        return closeIndex
    }

    return indexOfTrailingPartialMarker(text, SUGGESTIONS_CLOSE_PREFIX)
}

type JsonScanState = {
    depth: number
    inString: boolean
    isEscaped: boolean
}

function applyJsonObjectScanStep (state: JsonScanState, char: string): boolean {
    if (state.inString) {
        if (state.isEscaped) {
            state.isEscaped = false
            return false
        }
        if (char === '\\') {
            state.isEscaped = true
            return false
        }
        if (char === '"') {
            state.inString = false
        }
        return false
    }

    if (char === '"') {
        state.inString = true
        return false
    }
    if (char === '{') {
        state.depth += 1
        return false
    }
    if (char !== '}') {
        return false
    }

    state.depth -= 1
    return state.depth === 0
}

/**
 * End index (exclusive) of a JSON object starting at text[0] === '{',
 * or -1 if the object is incomplete / invalid for stripping.
 */
function findEndOfBalancedJsonObject (text: string): number {
    if (!text?.startsWith('{')) return -1

    const state: JsonScanState = { depth: 0, inString: false, isEscaped: false }
    for (let i = 0; i < text.length; i++) {
        if (applyJsonObjectScanStep(state, text[i])) {
            return i + 1
        }
    }

    return -1
}

function isIncompleteToolCallAfterHeader (line: string): boolean {
    const headerMatch = PARTIAL_TOOL_CALL_HEADER_REGEX.exec(line)
    if (!headerMatch) {
        return false
    }

    const rest = line.slice(headerMatch[1].length)
    if (!rest || rest[0] !== '{') {
        return true
    }

    return findEndOfBalancedJsonObject(rest) < 0
}

function isPartialToolCallTrace (line: string): boolean {
    if (!line) return false
    if (CALLING_PREFIX.startsWith(line)) return true
    if (PARTIAL_CALLING_TRACE_REGEX.test(line)) return true
    if (/^Calling\s+\S+\s+with(?:\s+input)?$/.test(line)) return true
    return isIncompleteToolCallAfterHeader(line)
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
    result = result.replace(CALLING_TRACE_REGEX, '')
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

function parseSuggestionLines (blockBody: string): string[] {
    return blockBody
        .split('\n')
        .flatMap((line) => {
            const trimmed = line.trim()
            if (!trimmed.startsWith('& ')) return []
            const suggestion = trimmed.slice(2).trim()
            return suggestion ? [suggestion] : []
        })
        .slice(0, 3)
}

function getSuggestionsFailureReason (
    textWithoutSuggestions: string,
    parsedSuggestions: string[],
): SuggestionsFailureReason | undefined {
    const hasLeakedServiceText = textWithoutSuggestions.includes(SUGGESTIONS_OPEN_PREFIX)
        || textWithoutSuggestions.includes(SUGGESTIONS_CLOSE_PREFIX)

    if (hasLeakedServiceText) {
        return 'service_text_leaked'
    }
    if (parsedSuggestions.length === 0) {
        return 'empty_after_parse'
    }
    return undefined
}

// Turns raw model output into chat UI fields (clean text + suggestion chips).
// Kept in utils so streaming buffer, finalize, and tests share one parser outside React.
export function parseAssistantAnswer (answer: string): ParsedAssistantAnswer {
    if (!answer || typeof answer !== 'string') {
        return { text: '', suggestions: [], suggestionsFailureReason: 'missing_block' }
    }

    const match = SUGGESTIONS_BLOCK_REGEX.exec(answer)
    if (!match) {
        const hasSuggestionMarkers = answer.includes(SUGGESTIONS_OPEN_PREFIX)
            || answer.includes(SUGGESTIONS_CLOSE_PREFIX)
        return {
            text: toDisplayText(answer),
            suggestions: [],
            suggestionsFailureReason: hasSuggestionMarkers ? 'service_text_leaked' : 'missing_block',
        }
    }

    const parsedSuggestions = parseSuggestionLines(match[1])
    const textWithoutSuggestions = stripServiceToolCallLines(
        answer.replace(SUGGESTIONS_BLOCK_REGEX, ''),
    ).trimEnd()

    return {
        text: textWithoutSuggestions,
        suggestions: parsedSuggestions,
        suggestionsFailureReason: getSuggestionsFailureReason(textWithoutSuggestions, parsedSuggestions),
    }
}
