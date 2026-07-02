export const SUGGESTIONS_BLOCK_REGEX = /\[\[SUGGESTIONS\]\]([\s\S]*?)\[\[\/SUGGESTIONS\]\]/m

const SUGGESTIONS_MARKER = '[[SUGGESTIONS]]'

export type ParsedAssistantAnswer = {
    text: string
    suggestions: string[]
    suggestionsFailureReason?: 'missing_block' | 'empty_after_parse' | 'service_text_leaked'
}

export function parseAssistantAnswer (answer: string): ParsedAssistantAnswer {
    if (!answer || typeof answer !== 'string') {
        return { text: '', suggestions: [], suggestionsFailureReason: 'missing_block' }
    }

    const match = answer.match(SUGGESTIONS_BLOCK_REGEX)
    if (!match) {
        const hasSuggestionMarkers = answer.includes('[[SUGGESTIONS') || answer.includes('[[/SUGGESTIONS')
        return {
            text: answer.trim(),
            suggestions: [],
            suggestionsFailureReason: hasSuggestionMarkers ? 'service_text_leaked' : 'missing_block',
        }
    }

    const suggestions = match[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('& '))
        .map((line) => line.slice(2).trim())
        .filter(Boolean)

    const textWithoutSuggestions = answer.replace(SUGGESTIONS_BLOCK_REGEX, '').trim()
    const hasLeakedServiceText = textWithoutSuggestions.includes('[[SUGGESTIONS') || textWithoutSuggestions.includes('[[/SUGGESTIONS')
    const parsedSuggestions = suggestions.slice(0, 3)

    return {
        text: textWithoutSuggestions,
        suggestions: parsedSuggestions,
        suggestionsFailureReason: hasLeakedServiceText
            ? 'service_text_leaked'
            : (parsedSuggestions.length === 0 ? 'empty_after_parse' : undefined),
    }
}

function stripIncompleteMarkerSuffix (text: string): string {
    for (let len = SUGGESTIONS_MARKER.length - 1; len >= 2; len--) {
        const prefix = SUGGESTIONS_MARKER.slice(0, len)
        if (text.endsWith(prefix)) {
            return text.slice(0, -len).trimEnd()
        }
    }

    return text
}

export function getStreamingDisplayText (buffer: string): string {
    if (!buffer) {
        return ''
    }

    if (SUGGESTIONS_BLOCK_REGEX.test(buffer)) {
        return buffer.replace(SUGGESTIONS_BLOCK_REGEX, '').trimEnd()
    }

    const blockStart = buffer.indexOf('[[SUGGESTIONS')
    if (blockStart !== -1) {
        return buffer.slice(0, blockStart).trimEnd()
    }

    return stripIncompleteMarkerSuffix(buffer)
}

export function resolveAssistantAnswerRaw (
    result: { answer?: string } | string | null | undefined,
    streamDataText: string,
    fallback: string,
): string {
    if (result && typeof result === 'object' && typeof result.answer === 'string') {
        return result.answer
    }

    if (typeof result === 'string' && result) {
        return result
    }

    if (streamDataText) {
        return streamDataText
    }

    return fallback
}
