import { extractA2UIMessages } from './parseAssistantAnswer'

const CREATE = '{"version":"v0.9","createSurface":{"surfaceId":"s","catalogId":"c"}}'
const UPDATE = '{"version":"v0.9","updateDataModel":{"surfaceId":"s","path":"/","value":{"title":"Заявки"}}}'

describe('extractA2UIMessages', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('returns the answer as text when it has no a2ui block', () => {
        expect(extractA2UIMessages('Просто ответ')).toEqual({ text: 'Просто ответ', a2uiMessages: [] })
    })

    it('returns empty result for a non-string answer', () => {
        expect(extractA2UIMessages(undefined as unknown as string)).toEqual({ text: '', a2uiMessages: [] })
    })

    it('parses each jsonl line of the block and strips the block from text', () => {
        const answer = `Вот график\n<a2ui>\n${CREATE}\n${UPDATE}\n</a2ui>`

        const result = extractA2UIMessages(answer)

        expect(result.text).toBe('Вот график')
        expect(result.a2uiMessages).toEqual([JSON.parse(CREATE), JSON.parse(UPDATE)])
    })

    it('parses a line whose quotes the model escaped', () => {
        const escaped = CREATE.replace(/"/g, '\\"')

        const result = extractA2UIMessages(`<a2ui>${escaped}</a2ui>`)

        expect(result.a2uiMessages).toEqual([JSON.parse(CREATE)])
    })

    it('skips broken lines and objects that are not a2ui messages', () => {
        const answer = [
            '<a2ui>',
            '{not json',
            '{"surfaceId":"s"}',
            UPDATE,
            '</a2ui>',
        ].join('\n')

        expect(extractA2UIMessages(answer).a2uiMessages).toEqual([JSON.parse(UPDATE)])
    })
})
