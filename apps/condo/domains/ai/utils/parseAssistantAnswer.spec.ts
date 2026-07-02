import {
    getStreamingDisplayText,
    parseAssistantAnswer,
    resolveAssistantAnswerRaw,
} from './parseAssistantAnswer'

describe('parseAssistantAnswer', () => {
    it('parses suggestions block from complete answer', () => {
        const answer = 'Hello\n\n[[SUGGESTIONS]]\n& One\n& Two\n[[/SUGGESTIONS]]'
        expect(parseAssistantAnswer(answer)).toEqual({
            text: 'Hello',
            suggestions: ['One', 'Two'],
        })
    })

    it('reports leaked service text when block is incomplete', () => {
        expect(parseAssistantAnswer('Hello [[SUGGESTIONS')).toEqual({
            text: 'Hello [[SUGGESTIONS',
            suggestions: [],
            suggestionsFailureReason: 'service_text_leaked',
        })
    })
})

describe('getStreamingDisplayText', () => {
    it('returns buffer as-is when no suggestions marker', () => {
        expect(getStreamingDisplayText('Hello world')).toBe('Hello world')
    })

    it('strips incomplete suggestions block', () => {
        expect(getStreamingDisplayText('Answer text\n\n[[SUGGESTIONS]]\n& Button')).toBe('Answer text')
    })

    it('strips partial marker suffix at end', () => {
        expect(getStreamingDisplayText('Answer text [[')).toBe('Answer text')
        expect(getStreamingDisplayText('Answer text [[SUGGEST')).toBe('Answer text')
        expect(getStreamingDisplayText('Answer text [[SUGGESTIONS')).toBe('Answer text')
    })

    it('strips complete suggestions block during stream', () => {
        const buffer = 'Answer\n\n[[SUGGESTIONS]]\n& A\n[[/SUGGESTIONS]]'
        expect(getStreamingDisplayText(buffer)).toBe('Answer')
    })
})

describe('resolveAssistantAnswerRaw', () => {
    it('prefers structured answer', () => {
        expect(resolveAssistantAnswerRaw({ answer: 'from result' }, 'stream', 'fallback')).toBe('from result')
    })

    it('falls back to stream text', () => {
        expect(resolveAssistantAnswerRaw(null, 'stream text', 'fallback')).toBe('stream text')
    })

    it('falls back to string result from streaming', () => {
        expect(resolveAssistantAnswerRaw('stream result', '', 'fallback')).toBe('stream result')
    })
})
