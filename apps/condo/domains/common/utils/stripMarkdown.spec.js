const { stripMarkdown } = require('./stripMarkdown')

describe('stripMarkdown', () => {
    it('returns empty string for empty input', () => {
        expect(stripMarkdown('')).toBe('')
        expect(stripMarkdown(null)).toBe('')
        expect(stripMarkdown()).toBe('')
    })

    it('removes emphasis and inline formatting', () => {
        expect(stripMarkdown('**bold** __bold underline__ `code` ~~strike~~')).toBe('bold bold underline code ~~strike~~')
    })

    it('removes links and images preserving text content', () => {
        expect(stripMarkdown('[OpenCondo](https://example.com) ![alt](https://example.com/image.png) text'))
            .toBe('OpenCondo text')
    })

    it('removes block level markdown like headings and quotes, but preserves list markers', () => {
        const input = '# Title\n> quote\n- item one\n1. item two'
        expect(stripMarkdown(input)).toBe('Title quote - item one 1. item two')
    })

    it('normalizes line breaks to single spaces and trims result', () => {
        const input = 'line one\n\nline two\n'
        expect(stripMarkdown(input)).toBe('line one line two')
    })

    it('handles mixed emphasis formatting', () => {
        expect(stripMarkdown('***bold italic*** __bold__')).toBe('*bold italic* bold')
    })

    it('preserves list markers (-, *, +) in plain text', () => {
        expect(stripMarkdown('- item one')).toBe('- item one')
        expect(stripMarkdown('* item two')).toBe('* item two')
        expect(stripMarkdown('+ item three')).toBe('+ item three')
        expect(stripMarkdown('Text - with dashes - in middle')).toBe('Text - with dashes - in middle')
        expect(stripMarkdown('Cost: 100 - 50 = 50')).toBe('Cost: 100 - 50 = 50')
    })

    it('preserves numbered list markers', () => {
        expect(stripMarkdown('1. first item')).toBe('1. first item')
        expect(stripMarkdown('2. second item')).toBe('2. second item')
        expect(stripMarkdown('10. tenth item')).toBe('10. tenth item')
    })

    it('handles complex markdown combinations', () => {
        const input = '# Main Title\n\n## Subtitle\n\nThis is **bold** and _italic_ text with [a link](http://example.com) and `inline code`.\n\n- List item 1\n- List item 2 with **bold**\n\n> A blockquote with `code` inside'
        expect(stripMarkdown(input)).toBe('Main Title Subtitle This is bold and _italic_ text with a link and inline code. - List item 1 - List item 2 with bold A blockquote with code inside')
    })

    it('preserves plain text and special characters', () => {
        const input = 'Plain text with numbers 123, symbols @#$%, and punctuation .,!?'
        expect(stripMarkdown(input)).toBe('Plain text with numbers 123, symbols @#$%, and punctuation .,!?')
    })

    it('preserves ~ character in text', () => {
        expect(stripMarkdown('~~strikethrough~~')).toBe('~~strikethrough~~')
        expect(stripMarkdown('Price ~ 100 USD')).toBe('Price ~ 100 USD')
    })

    it('handles multiple consecutive spaces and line breaks', () => {
        const input = 'text  with   multiple\n\n\nspaces   and\n\nbreaks'
        expect(stripMarkdown(input)).toBe('text with multiple spaces and breaks')
    })

    it('preserves emoji and unicode characters', () => {
        const input = 'Text with emoji 😊 and unicode ñáéíóú'
        expect(stripMarkdown(input)).toBe('Text with emoji 😊 and unicode ñáéíóú')
    })

    it('handles edge case with only whitespace', () => {
        expect(stripMarkdown('   \n\n   \t  \n   ')).toBe('')
    })

    it('preserves URLs in plain text', () => {
        expect(stripMarkdown('Visit https://example.com for more info')).toBe('Visit https://example.com for more info')
    })

    it('handles email addresses', () => {
        expect(stripMarkdown('Contact us at support@example.com')).toBe('Contact us at support@example.com')
    })
})
