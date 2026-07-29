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

    it('removes narrative tool status lines', () => {
        const raw = 'Calling getProperties to find the house by address.Не нашёл дом по адресу «12 корпус 2».'

        expect(toDisplayText(raw)).toBe('Не нашёл дом по адресу «12 корпус 2».')
    })

    it('removes narrative tool status on its own line', () => {
        const raw = 'Calling getProperties to find the house by address.\nНе нашёл дом.'

        expect(toDisplayText(raw)).toBe('Не нашёл дом.')
    })

    it('removes lowercase multi-word Calling status', () => {
        const raw = 'Calling report scenario for negative analysis\nГотово.'

        expect(toDisplayText(raw)).toBe('Готово.')
    })

    // TEMP: RU-only chat — EN "Calling …" prose is treated as agent noise for now.
    it('removes English Calling prose while chat is RU-only', () => {
        expect(toDisplayText('Calling the resident is the next step.')).toBe('')
        expect(toDisplayText('Calling a technician may help tomorrow.\nОк.')).toBe('Ок.')
    })

    it('hides incomplete tool traces while streaming', () => {
        expect(toDisplayText('Hello\nCalling getTickets with input: {"a":')).toBe('Hello')
        expect(toDisplayText('Hello\nCalling getTickets with input:')).toBe('Hello')
        expect(toDisplayText('Hello\nCalling getTickets')).toBe('Hello')
        expect(toDisplayText('Hello\nCalling report scenario')).toBe('Hello')
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
