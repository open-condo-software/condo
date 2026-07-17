const SUGGESTIONS_OPEN_PREFIX = '[[SUGGESTIONS'
const SUGGESTIONS_CLOSE_PREFIX = '[[/SUGGESTIONS'
const SUGGESTIONS_BLOCK_REGEX = /\[\[SUGGESTIONS\]\]([\s\S]*?)\[\[\/SUGGESTIONS\]\]/m

const CALLING_PREFIX = 'Calling'
/** Stop before Cyrillic so "Calling ….За текущий месяц" still strips the tool line. */
const CALLING_SERVICE_REGEX = /Calling\b[^\n\u0400-\u04FF]*/g

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

function isCallingPrefix (line: string): boolean {
    if (!line) return false

    for (let size = CALLING_PREFIX.length; size >= 1; size--) {
        if (line === CALLING_PREFIX.slice(0, size)) {
            return true
        }
    }

    return false
}

function stripServiceToolCallLines (text: string): string {
    let result = text.replace(CALLING_SERVICE_REGEX, '')
    result = result.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n')

    const lastNewlineIndex = result.lastIndexOf('\n')
    const lastLine = lastNewlineIndex >= 0 ? result.slice(lastNewlineIndex + 1) : result
    if (isCallingPrefix(lastLine)) {
        return (lastNewlineIndex >= 0 ? result.slice(0, lastNewlineIndex) : '').trimEnd()
    }

    return result
}

function stripSuggestionsForDisplay (text: string): string {
    const completeBlockMatch = text.match(SUGGESTIONS_BLOCK_REGEX)
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

export function parseAssistantAnswer (answer: string): ParsedAssistantAnswer {
    if (!answer || typeof answer !== 'string') {
        return { text: '', suggestions: [], suggestionsFailureReason: 'missing_block' }
    }

    const match = answer.match(SUGGESTIONS_BLOCK_REGEX)
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

    return {
        text: textWithoutSuggestions,
        suggestions: parsedSuggestions,
        suggestionsFailureReason: hasLeakedServiceText
            ? 'service_text_leaked'
            : (parsedSuggestions.length === 0 ? 'empty_after_parse' : undefined),
    }
}
