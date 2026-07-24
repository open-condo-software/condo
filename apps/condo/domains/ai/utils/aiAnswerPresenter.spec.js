import { parseAssistantAnswer, toDisplayText } from './aiAnswerPresenter'

describe('aiAnswerPresenter tool-trace stripping', () => {
    it('removes structured Calling tool traces', () => {
        const raw = 'Calling getTickets with input: {"filters":{"from":"2026-07-08","to":"2026-07-16"}}\nTickets found.'

        expect(toDisplayText(raw)).toBe('Tickets found.')
    })

    it('removes n8n-style traces even with messy nested quotes in JSON', () => {
        const raw = 'Calling getTickets with input: {"filters":"{"from":"2026-07-08","to":"2026-07-16"}"}\nOk.'

        expect(toDisplayText(raw)).toBe('Ok.')
    })

    it('stops at JSON end when Cyrillic text is glued after the trace', () => {
        const raw = 'Calling getTickets with input: {"q":1}За текущий месяц'

        expect(toDisplayText(raw)).toBe('За текущий месяц')
    })

    it('keeps English sentences that start with Calling', () => {
        const raw = 'Calling the resident is the next step.'

        expect(toDisplayText(raw)).toBe(raw)
    })

    it('keeps Spanish sentences that start with Calling', () => {
        const raw = 'Calling a technician may help tomorrow.'

        expect(toDisplayText(raw)).toBe(raw)
    })

    it('hides incomplete tool traces while streaming', () => {
        expect(toDisplayText('Hello\nCalling getTickets with input: {"a":')).toBe('Hello')
        expect(toDisplayText('Hello\nCalling getTickets with input:')).toBe('Hello')
        expect(toDisplayText('Hello\nCalling getTickets')).toBe('Hello')
    })

    it('parseAssistantAnswer still returns suggestions after stripping traces', () => {
        const raw = [
            'Calling getTickets with input: {"x":1}',
            'Done.',
            '[[SUGGESTIONS]]',
            '& One',
            '& Two',
            '[[/SUGGESTIONS]]',
        ].join('\n')

        expect(parseAssistantAnswer(raw)).toEqual({
            text: 'Done.',
            suggestions: ['One', 'Two'],
            suggestionsFailureReason: undefined,
        })
    })
})
